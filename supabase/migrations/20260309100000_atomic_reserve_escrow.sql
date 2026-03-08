-- Migration: SEC-05 - Atomic reserve_escrow RPC
-- Prevents race condition where balance is deducted but escrow insert fails/client crashes

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
    -- 1. Get company wallet (locked for update to prevent concurrent modifications)
    SELECT id, balance INTO v_wallet_id, v_balance
    FROM wallets
    WHERE user_id = p_company_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Carteira nao encontrada para usuario: %', p_company_user_id;
    END IF;

    -- 2. Check sufficient balance
    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Saldo insuficiente. Disponivel: %, Necessario: %', v_balance, p_amount;
    END IF;

    -- 3. Atomically deduct balance
    UPDATE wallets
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE id = v_wallet_id;

    -- 4. Create escrow record (unique partial index prevents duplicates)
    INSERT INTO escrow_transactions(job_id, amount, company_wallet_id, status)
    VALUES (p_job_id, p_amount, v_wallet_id, 'reserved')
    RETURNING id INTO v_escrow_id;

    -- 5. Log the transaction
    INSERT INTO wallet_transactions(wallet_id, amount, type, description, reference_id)
    VALUES (v_wallet_id, -p_amount, 'escrow_reserve', 'Valor reservado para vaga', p_job_id::TEXT);

    RETURN v_escrow_id;
END;
$$;
