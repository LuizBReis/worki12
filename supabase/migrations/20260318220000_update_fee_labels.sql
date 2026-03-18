-- Update credit_deposit fee description to separate Worki fee from operator fee

CREATE OR REPLACE FUNCTION credit_deposit(
    p_user_id UUID,
    p_amount DECIMAL,
    p_payment_id TEXT,
    p_description TEXT DEFAULT 'Deposito via PIX'
) RETURNS BOOLEAN
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
    v_inserted BOOLEAN;
BEGIN
    -- Find wallet
    SELECT id, user_type INTO v_wallet_id, v_user_type
    FROM wallets WHERE user_id = p_user_id;

    IF v_wallet_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Calculate fees (only for companies)
    IF v_user_type = 'company' THEN
        v_service_fee := ROUND(p_amount * 0.08, 2);
        v_credit_amount := p_amount - v_service_fee - v_processing_fee;
        IF v_credit_amount < 0 THEN v_credit_amount := 0; END IF;
    ELSE
        v_service_fee := 0;
        v_processing_fee := 0;
        v_credit_amount := p_amount;
    END IF;

    -- Insert transaction (dedup)
    INSERT INTO wallet_transactions(wallet_id, amount, type, description, reference_id)
    VALUES (v_wallet_id, v_credit_amount, 'credit', p_description, p_payment_id)
    ON CONFLICT (wallet_id, reference_id) WHERE reference_id IS NOT NULL DO NOTHING;

    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF NOT v_inserted THEN RETURN FALSE; END IF;

    -- Credit wallet
    UPDATE wallets SET balance = balance + v_credit_amount WHERE id = v_wallet_id;

    -- Log platform fee
    IF v_service_fee + v_processing_fee > 0 THEN
        INSERT INTO wallet_transactions(wallet_id, amount, type, description, reference_id)
        VALUES (v_wallet_id, -(v_service_fee + v_processing_fee), 'platform_fee',
            'Worki (8%): R$' || v_service_fee::TEXT || ' + Operador financeiro: R$' || v_processing_fee::TEXT,
            'fee_' || p_payment_id);
    END IF;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION credit_deposit(UUID, DECIMAL, TEXT, TEXT) TO service_role, authenticated;
