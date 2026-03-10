-- Migration: Recreate ALL financial RPCs + Grant EXECUTE permissions
-- These functions were never actually created (migrations were marked applied via repair)
-- This migration ensures they exist AND are accessible via PostgREST

-- =============================================
-- 1. CONSTRAINTS & INDEXES (idempotent)
-- =============================================

-- Balance non-negative constraint
DO $$ BEGIN
    ALTER TABLE wallets ADD CONSTRAINT wallets_balance_non_negative CHECK (balance >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- One active escrow per job
CREATE UNIQUE INDEX IF NOT EXISTS idx_escrow_one_reserved_per_job
ON escrow_transactions(job_id) WHERE status = 'reserved';

-- Unique reference per wallet (prevents double-processing)
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_tx_unique_reference
ON wallet_transactions(wallet_id, reference_id) WHERE reference_id IS NOT NULL;

-- =============================================
-- 2. ALL FINANCIAL RPCs
-- =============================================

-- RPC: Atomic balance update
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
    SET balance = balance + p_amount, updated_at = NOW()
    WHERE id = p_wallet_id
    RETURNING balance INTO v_new_balance;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found: %', p_wallet_id;
    END IF;

    RETURN v_new_balance;
END;
$$;

-- RPC: Atomic credit deposit (webhook idempotency)
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
    SELECT id INTO v_wallet_id FROM wallets WHERE user_id = p_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found for user: %', p_user_id;
    END IF;

    INSERT INTO wallet_transactions(wallet_id, amount, type, description, reference_id)
    VALUES (v_wallet_id, p_amount, 'credit', p_description, p_payment_id)
    ON CONFLICT (wallet_id, reference_id) WHERE reference_id IS NOT NULL
    DO NOTHING;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    UPDATE wallets
    SET balance = balance + p_amount, updated_at = NOW()
    WHERE id = v_wallet_id;

    RETURN TRUE;
END;
$$;

-- RPC: Atomic escrow reserve
CREATE OR REPLACE FUNCTION reserve_escrow(
    p_job_id UUID,
    p_amount DECIMAL,
    p_company_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet_id UUID;
    v_balance DECIMAL;
    v_escrow_id UUID;
BEGIN
    SELECT id, balance INTO v_wallet_id, v_balance
    FROM wallets WHERE user_id = p_company_user_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Carteira nao encontrada para usuario: %', p_company_user_id;
    END IF;

    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Saldo insuficiente. Disponivel: %, Necessario: %', v_balance, p_amount;
    END IF;

    UPDATE wallets
    SET balance = balance - p_amount, updated_at = NOW()
    WHERE id = v_wallet_id;

    INSERT INTO escrow_transactions(job_id, amount, company_wallet_id, status)
    VALUES (p_job_id, p_amount, v_wallet_id, 'reserved')
    RETURNING id INTO v_escrow_id;

    INSERT INTO wallet_transactions(wallet_id, amount, type, description, reference_id)
    VALUES (v_wallet_id, -p_amount, 'escrow_reserve', 'Valor reservado para vaga', p_job_id::TEXT);

    RETURN v_escrow_id;
END;
$$;

-- RPC: Atomic escrow release
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
    UPDATE escrow_transactions
    SET status = 'released', released_at = NOW(), worker_wallet_id = p_worker_wallet_id
    WHERE job_id = p_job_id AND status = 'reserved'
    RETURNING id, amount INTO v_escrow_id, v_amount;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No reserved escrow found for job: %', p_job_id;
    END IF;

    UPDATE wallets
    SET balance = balance + v_amount, updated_at = NOW()
    WHERE id = p_worker_wallet_id;

    INSERT INTO wallet_transactions(wallet_id, amount, type, description, reference_id)
    VALUES (p_worker_wallet_id, v_amount, 'escrow_release', 'Pagamento recebido pela vaga', p_job_id::TEXT);

    RETURN QUERY SELECT v_escrow_id, v_amount;
END;
$$;

-- RPC: Atomic escrow refund
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
    UPDATE escrow_transactions
    SET status = 'refunded'
    WHERE job_id = p_job_id AND status = 'reserved'
    RETURNING id, amount, company_wallet_id INTO v_escrow_id, v_amount, v_company_wallet_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No reserved escrow found for job: %', p_job_id;
    END IF;

    UPDATE wallets
    SET balance = balance + v_amount, updated_at = NOW()
    WHERE id = v_company_wallet_id;

    INSERT INTO wallet_transactions(wallet_id, amount, type, description, reference_id)
    VALUES (v_company_wallet_id, v_amount, 'credit', p_reason, 'refund-' || p_job_id::TEXT);

    RETURN QUERY SELECT v_escrow_id, v_amount;
END;
$$;

-- =============================================
-- 3. GRANT EXECUTE to PostgREST roles
-- =============================================
GRANT EXECUTE ON FUNCTION credit_deposit(UUID, DECIMAL, TEXT, TEXT) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION update_wallet_balance(UUID, DECIMAL) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION reserve_escrow(UUID, DECIMAL, UUID) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION release_escrow(UUID, UUID) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION refund_escrow(UUID, TEXT) TO service_role, authenticated;
