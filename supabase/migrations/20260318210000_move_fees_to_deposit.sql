-- Migration: Move company fees from escrow to deposit
-- BEFORE: Company deposited R$200, got R$200, then paid R$220 on escrow (confusing)
-- AFTER: Company deposits R$200, pays R$200 but gets R$180 credited (fees upfront), escrow debits exact budget amount

-- =============================================
-- 1. REVERT reserve_escrow — remove fees, escrow is now fee-free
--    Keeps security hardening (search_path, caller validation, FOR UPDATE)
-- =============================================
CREATE OR REPLACE FUNCTION reserve_escrow(
    p_job_id UUID,
    p_amount DECIMAL,
    p_company_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_wallet_id UUID;
    v_balance DECIMAL;
    v_escrow_id UUID;
BEGIN
    -- SECURITY: Authenticated users can only reserve for themselves
    IF auth.uid() IS NOT NULL AND auth.uid() != p_company_user_id THEN
        RAISE EXCEPTION 'Nao autorizado: nao pode reservar escrow para outro usuario';
    END IF;

    -- SECURITY: Validate caller actually owns the job
    IF auth.uid() IS NOT NULL THEN
        IF NOT EXISTS(SELECT 1 FROM jobs WHERE id = p_job_id AND company_id = auth.uid()) THEN
            RAISE EXCEPTION 'Nao autorizado: voce nao e dono do job %', p_job_id;
        END IF;
    END IF;

    -- 1. Get company wallet (locked for update to prevent concurrent modifications)
    SELECT id, balance INTO v_wallet_id, v_balance
    FROM wallets
    WHERE user_id = p_company_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Carteira nao encontrada para usuario: %', p_company_user_id;
    END IF;

    -- 2. Check sufficient balance (only the job amount, no fees)
    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Saldo insuficiente. Necessario R$ %', p_amount;
    END IF;

    -- 3. Atomically deduct ONLY the job amount from balance
    UPDATE wallets
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE id = v_wallet_id;

    -- 4. Create escrow record (no fees stored)
    INSERT INTO escrow_transactions(job_id, amount, service_fee, processing_fee, company_wallet_id, status)
    VALUES (p_job_id, p_amount, 0, 0, v_wallet_id, 'reserved')
    RETURNING id INTO v_escrow_id;

    -- 5. Log the escrow reserve transaction
    INSERT INTO wallet_transactions(wallet_id, amount, type, description, reference_id)
    VALUES (v_wallet_id, -(p_amount), 'escrow_reserve', 'Valor reservado para vaga', p_job_id::TEXT);

    RETURN v_escrow_id;
END;
$$;

GRANT EXECUTE ON FUNCTION reserve_escrow(UUID, DECIMAL, UUID) TO service_role, authenticated;

-- =============================================
-- 2. MODIFY credit_deposit — apply platform fees on deposit for companies
--    Workers don't deposit (they earn via escrow release), so no fees for them
-- =============================================
CREATE OR REPLACE FUNCTION credit_deposit(
    p_user_id UUID,
    p_amount DECIMAL,
    p_payment_id TEXT,
    p_description TEXT DEFAULT 'Deposito via Pix'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_wallet_id UUID;
    v_user_type TEXT;
    v_service_fee DECIMAL;
    v_processing_fee DECIMAL := 4.00;
    v_credit_amount DECIMAL;
BEGIN
    -- Find wallet and user type
    SELECT id, user_type INTO v_wallet_id, v_user_type
    FROM wallets
    WHERE user_id = p_user_id;

    IF v_wallet_id IS NULL THEN
        RAISE EXCEPTION 'Wallet not found for user: %', p_user_id;
    END IF;

    -- Calculate fees: only companies pay deposit fees
    IF v_user_type = 'company' THEN
        v_service_fee := ROUND(p_amount * 0.08, 2);
        v_credit_amount := p_amount - v_service_fee - v_processing_fee;
        IF v_credit_amount < 0 THEN v_credit_amount := 0; END IF;
    ELSE
        v_service_fee := 0;
        v_processing_fee := 0;
        v_credit_amount := p_amount;
    END IF;

    -- Insert credit transaction (dedup by wallet_id + reference_id unique constraint)
    INSERT INTO wallet_transactions(wallet_id, amount, type, description, reference_id)
    VALUES (v_wallet_id, v_credit_amount, 'credit', p_description, p_payment_id)
    ON CONFLICT (wallet_id, reference_id) WHERE reference_id IS NOT NULL
    DO NOTHING;

    -- If insert was a no-op (already existed), return false
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Credit wallet with net amount (after platform fees)
    UPDATE wallets
    SET balance = balance + v_credit_amount,
        updated_at = NOW()
    WHERE id = v_wallet_id;

    -- Log platform fee as separate transaction if charged
    IF v_service_fee + v_processing_fee > 0 THEN
        INSERT INTO wallet_transactions(wallet_id, amount, type, description, reference_id)
        VALUES (v_wallet_id, -(v_service_fee + v_processing_fee), 'platform_fee',
            'Taxa de servico (8%): R$ ' || v_service_fee::TEXT || ' + Processamento: R$ ' || v_processing_fee::TEXT,
            'fee_' || p_payment_id);
    END IF;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION credit_deposit(UUID, DECIMAL, TEXT, TEXT) TO service_role, authenticated;
