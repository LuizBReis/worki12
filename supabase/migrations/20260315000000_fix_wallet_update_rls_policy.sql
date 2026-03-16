-- Migration: Fix wallet UPDATE RLS policy (SEC-02)
-- Problem: subquery WITH CHECK using self-referencing balance check is redundant
-- and can be bypassed. Replace with column-level trigger validation.
-- Only asaas_customer_id should be updatable by the user; balance changes
-- must go through SECURITY DEFINER RPCs only.

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can update own wallet non-financial fields" ON wallets;

-- Simple ownership-only RLS policy (no subquery tricks)
CREATE POLICY "Users can update own wallet non-financial fields" ON wallets
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Column-level trigger to block direct balance manipulation
CREATE OR REPLACE FUNCTION validate_wallet_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Bypass for service_role / internal RPCs (auth.uid() is NULL)
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    -- Block balance changes from authenticated users
    IF NEW.balance IS DISTINCT FROM OLD.balance THEN
        RAISE EXCEPTION 'Alteracao direta de saldo nao permitida. Use as funcoes de deposito/saque.';
    END IF;

    -- Block user_type changes
    IF NEW.user_type IS DISTINCT FROM OLD.user_type THEN
        RAISE EXCEPTION 'Alteracao de tipo de usuario nao permitida.';
    END IF;

    -- Block user_id changes
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
        RAISE EXCEPTION 'Alteracao de user_id nao permitida.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_wallet_update ON wallets;
CREATE TRIGGER trg_validate_wallet_update
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION validate_wallet_update();
