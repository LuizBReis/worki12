-- Migration: Pricing Service Fees
-- Adds service_fee and processing_fee columns to escrow_transactions
-- Updates reserve_escrow RPC to charge company fees at escrow time
-- Adds 'platform_fee' to wallet_transactions type CHECK constraint

-- 1. Add fee columns to escrow_transactions
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS service_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(10,2) DEFAULT 0;

-- 2. Update wallet_transactions type CHECK constraint to include 'platform_fee'
-- Drop the old constraint and recreate with new allowed types
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_type_check
  CHECK (type IN ('credit', 'debit', 'escrow_reserve', 'escrow_release', 'initial_balance', 'platform_fee'));

-- 3. Recreate reserve_escrow with service fees
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
    v_service_fee DECIMAL := ROUND(p_amount * 0.08, 2);
    v_processing_fee DECIMAL := 4.00;
    v_total DECIMAL := p_amount + v_service_fee + v_processing_fee;
    v_escrow_id UUID;
BEGIN
    -- 1. Get company wallet (locked for update to prevent concurrent modifications)
    SELECT id, balance INTO v_wallet_id, v_balance
    FROM wallets
    WHERE user_id = p_company_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Carteira nao encontrada para usuario: %', p_company_user_id;
    END IF;

    -- 2. Check sufficient balance (must cover amount + fees)
    IF v_balance < v_total THEN
        RAISE EXCEPTION 'Saldo insuficiente. Disponivel: R$ %, Necessario: R$ % (servico R$ % + taxa 8%% R$ % + processamento R$ %)',
            v_balance, v_total, p_amount, v_service_fee, v_processing_fee;
    END IF;

    -- 3. Atomically deduct total (amount + fees) from balance
    UPDATE wallets
    SET balance = balance - v_total,
        updated_at = NOW()
    WHERE id = v_wallet_id;

    -- 4. Create escrow record (stores job amount and fee breakdown)
    INSERT INTO escrow_transactions(job_id, amount, service_fee, processing_fee, company_wallet_id, status)
    VALUES (p_job_id, p_amount, v_service_fee, v_processing_fee, v_wallet_id, 'reserved')
    RETURNING id INTO v_escrow_id;

    -- 5. Log the escrow reserve (job amount only)
    INSERT INTO wallet_transactions(wallet_id, amount, type, description, reference_id)
    VALUES (v_wallet_id, -p_amount, 'escrow_reserve', 'Valor reservado para vaga', p_job_id::TEXT);

    -- 6. Log the platform fee as separate transaction (different reference_id to avoid unique constraint)
    INSERT INTO wallet_transactions(wallet_id, amount, type, description, reference_id)
    VALUES (v_wallet_id, -(v_service_fee + v_processing_fee), 'platform_fee',
        'Taxa de servico (8%) R$ ' || v_service_fee::TEXT || ' + processamento R$ ' || v_processing_fee::TEXT,
        'fee-' || p_job_id::TEXT);

    RETURN v_escrow_id;
END;
$$;

-- 4. Grant execute permissions
GRANT EXECUTE ON FUNCTION reserve_escrow(UUID, DECIMAL, UUID) TO service_role, authenticated;
