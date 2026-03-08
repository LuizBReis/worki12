-- Migration: Fix critical issues in wallet/escrow system
-- 1. Change reference_id from UUID to TEXT (Asaas IDs are text, not UUIDs)
-- 2. Add missing INSERT/UPDATE RLS policies for wallets, escrow_transactions, wallet_transactions

-- =============================================
-- 1. FIX reference_id column type (UUID → TEXT)
-- =============================================
-- Drop the unique index first (depends on the column)
DROP INDEX IF EXISTS idx_wallet_tx_unique_reference;

-- Change column type from UUID to TEXT
ALTER TABLE wallet_transactions ALTER COLUMN reference_id TYPE TEXT USING reference_id::TEXT;

-- Recreate the unique partial index with TEXT type
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_tx_unique_reference
ON wallet_transactions(wallet_id, reference_id) WHERE reference_id IS NOT NULL;

-- =============================================
-- 2. ADD MISSING RLS POLICIES
-- =============================================

-- Wallets: Users can create their own wallet
CREATE POLICY "Users can insert their own wallet" ON wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Escrow Transactions: Companies can insert escrow for their wallet
CREATE POLICY "Company can insert escrow" ON escrow_transactions
    FOR INSERT WITH CHECK (
        company_wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
    );

-- Wallet Transactions: Users can insert transactions for their own wallet
CREATE POLICY "Users can insert their transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (
        wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
    );

-- =============================================
-- 3. RECREATE RPCs with correct reference_id type
-- =============================================

-- Recreate release_escrow (reference_id is now TEXT, no cast needed)
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

    -- Log the transaction (reference_id is now TEXT)
    INSERT INTO wallet_transactions(wallet_id, amount, type, description, reference_id)
    VALUES (p_worker_wallet_id, v_amount, 'escrow_release', 'Pagamento recebido pela vaga', p_job_id::TEXT);

    RETURN QUERY SELECT v_escrow_id, v_amount;
END;
$$;

-- Recreate refund_escrow (reference_id is now TEXT)
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

    -- Log the refund (reference_id is now TEXT, prefix is fine)
    INSERT INTO wallet_transactions(wallet_id, amount, type, description, reference_id)
    VALUES (v_company_wallet_id, v_amount, 'credit', p_reason, 'refund-' || p_job_id::TEXT);

    RETURN QUERY SELECT v_escrow_id, v_amount;
END;
$$;

-- Recreate credit_deposit (reference_id is now TEXT, Asaas payment IDs work)
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
