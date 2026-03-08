-- Migration: Atomic balance operations and security constraints
-- Prevents race conditions, double-releases, and negative balances

-- 1. Constraint: balance can never go negative
ALTER TABLE wallets ADD CONSTRAINT wallets_balance_non_negative CHECK (balance >= 0);

-- 2. Unique partial index: only one active (reserved) escrow per job
CREATE UNIQUE INDEX IF NOT EXISTS idx_escrow_one_reserved_per_job
ON escrow_transactions(job_id) WHERE status = 'reserved';

-- 3. Unique constraint on wallet_transactions to prevent duplicate payment processing
-- (wallet_id + reference_id must be unique when reference_id is not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_tx_unique_reference
ON wallet_transactions(wallet_id, reference_id) WHERE reference_id IS NOT NULL;

-- 4. RPC: Atomic balance increment (prevents read-then-write race conditions)
CREATE OR REPLACE FUNCTION update_wallet_balance(
    p_wallet_id UUID,
    p_amount DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_balance DECIMAL;
BEGIN
    UPDATE wallets
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE id = p_wallet_id
    RETURNING balance INTO v_new_balance;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found: %', p_wallet_id;
    END IF;

    RETURN v_new_balance;
END;
$$;

-- 5. RPC: Atomic escrow release (prevents double-release)
CREATE OR REPLACE FUNCTION release_escrow(
    p_job_id UUID,
    p_worker_wallet_id UUID
)
RETURNS TABLE(escrow_id UUID, escrow_amount DECIMAL)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_escrow_id UUID;
    v_amount DECIMAL;
BEGIN
    -- Atomically update escrow status (only if still reserved)
    UPDATE escrow_transactions
    SET status = 'released',
        released_at = NOW(),
        worker_wallet_id = p_worker_wallet_id
    WHERE job_id = p_job_id
      AND status = 'reserved'
    RETURNING id, amount INTO v_escrow_id, v_amount;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No reserved escrow found for job: %', p_job_id;
    END IF;

    -- Atomically credit worker wallet
    UPDATE wallets
    SET balance = balance + v_amount,
        updated_at = NOW()
    WHERE id = p_worker_wallet_id;

    -- Log the transaction
    INSERT INTO wallet_transactions(wallet_id, amount, type, description, reference_id)
    VALUES (p_worker_wallet_id, v_amount, 'escrow_release', 'Pagamento recebido pela vaga', p_job_id::TEXT);

    RETURN QUERY SELECT v_escrow_id, v_amount;
END;
$$;

-- 6. RPC: Atomic escrow refund (prevents double-refund)
CREATE OR REPLACE FUNCTION refund_escrow(
    p_job_id UUID,
    p_reason TEXT DEFAULT 'Reembolso de vaga cancelada'
)
RETURNS TABLE(escrow_id UUID, escrow_amount DECIMAL)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_escrow_id UUID;
    v_amount DECIMAL;
    v_company_wallet_id UUID;
BEGIN
    -- Atomically update escrow status (only if still reserved)
    UPDATE escrow_transactions
    SET status = 'refunded'
    WHERE job_id = p_job_id
      AND status = 'reserved'
    RETURNING id, amount, company_wallet_id INTO v_escrow_id, v_amount, v_company_wallet_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No reserved escrow found for job: %', p_job_id;
    END IF;

    -- Atomically credit company wallet
    UPDATE wallets
    SET balance = balance + v_amount,
        updated_at = NOW()
    WHERE id = v_company_wallet_id;

    -- Log the refund
    INSERT INTO wallet_transactions(wallet_id, amount, type, description, reference_id)
    VALUES (v_company_wallet_id, v_amount, 'credit', p_reason, 'refund-' || p_job_id::TEXT);

    RETURN QUERY SELECT v_escrow_id, v_amount;
END;
$$;

-- 7. RPC: Atomic deposit credit (prevents webhook double-processing)
CREATE OR REPLACE FUNCTION credit_deposit(
    p_user_id UUID,
    p_amount DECIMAL,
    p_payment_id TEXT,
    p_description TEXT DEFAULT 'Deposito via Pix'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet_id UUID;
BEGIN
    -- Get wallet id
    SELECT id INTO v_wallet_id FROM wallets WHERE user_id = p_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found for user: %', p_user_id;
    END IF;

    -- Insert transaction (will fail on unique constraint if already processed)
    INSERT INTO wallet_transactions(wallet_id, amount, type, description, reference_id)
    VALUES (v_wallet_id, p_amount, 'credit', p_description, p_payment_id)
    ON CONFLICT (wallet_id, reference_id) WHERE reference_id IS NOT NULL
    DO NOTHING;

    -- If insert was a no-op (already existed), return false
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Atomically update balance
    UPDATE wallets
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE id = v_wallet_id;

    RETURN TRUE;
END;
$$;
