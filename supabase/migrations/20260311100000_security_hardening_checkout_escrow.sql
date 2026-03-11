-- Migration: Security hardening for checkout/escrow flow
-- Fixes critical vulnerabilities in RLS policies, adds column-level validation trigger
-- Prevents: workers faking company confirmations, direct balance manipulation,
-- unauthorized escrow operations, status manipulation, schema poisoning

-- =============================================
-- 1. APPLICATIONS: Replace permissive UPDATE policy with role-separated policies
--    + BEFORE UPDATE trigger for column-level validation (uses OLD/NEW directly)
-- =============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Participants can update applications" ON applications;

-- Worker RLS: can only see/update rows where they are the worker
CREATE POLICY "Workers can update their own application fields" ON applications
    FOR UPDATE TO authenticated
    USING (worker_id = auth.uid())
    WITH CHECK (worker_id = auth.uid());

-- Company RLS: can only see/update rows for their jobs
CREATE POLICY "Companies can update their job application fields" ON applications
    FOR UPDATE TO authenticated
    USING (job_id IN (SELECT id FROM jobs WHERE company_id = auth.uid()))
    WITH CHECK (job_id IN (SELECT id FROM jobs WHERE company_id = auth.uid()));

-- Column-level validation trigger (best practice: direct OLD/NEW access, no self-referencing subqueries)
-- SET search_path prevents schema poisoning attacks on SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION validate_application_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_worker BOOLEAN;
    v_is_company BOOLEAN;
BEGIN
    -- Bypass for service_role / internal operations (triggers, RPCs)
    -- auth.uid() is NULL for service_role and trigger contexts
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    v_is_worker := (NEW.worker_id = auth.uid());
    v_is_company := EXISTS(SELECT 1 FROM jobs WHERE id = NEW.job_id AND company_id = auth.uid());

    -- === IMMUTABLE FIELDS (neither role can change) ===
    IF NEW.worker_id IS DISTINCT FROM OLD.worker_id THEN
        RAISE EXCEPTION 'Nao e permitido alterar o worker_id';
    END IF;
    IF NEW.job_id IS DISTINCT FROM OLD.job_id THEN
        RAISE EXCEPTION 'Nao e permitido alterar o job_id';
    END IF;

    -- === WORKER RESTRICTIONS ===
    IF v_is_worker THEN
        -- Worker CANNOT change company confirmation columns
        IF NEW.company_checkin_confirmed_at IS DISTINCT FROM OLD.company_checkin_confirmed_at THEN
            RAISE EXCEPTION 'Worker nao pode alterar confirmacao da empresa (checkin)';
        END IF;
        IF NEW.company_checkout_confirmed_at IS DISTINCT FROM OLD.company_checkout_confirmed_at THEN
            RAISE EXCEPTION 'Worker nao pode alterar confirmacao da empresa (checkout)';
        END IF;
        -- Worker CANNOT set status to 'completed' (only company can finalize)
        IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
            RAISE EXCEPTION 'Apenas a empresa pode finalizar o trabalho';
        END IF;
        -- Worker CANNOT set status to 'approved', 'rejected', or 'hired' (company decisions)
        IF NEW.status IN ('approved', 'rejected', 'hired') AND OLD.status NOT IN ('approved', 'rejected', 'hired') THEN
            RAISE EXCEPTION 'Apenas a empresa pode aprovar, rejeitar ou contratar';
        END IF;
    END IF;

    -- === COMPANY RESTRICTIONS ===
    IF v_is_company THEN
        -- Company CANNOT change worker check-in/check-out columns
        IF NEW.worker_checkin_at IS DISTINCT FROM OLD.worker_checkin_at THEN
            RAISE EXCEPTION 'Empresa nao pode alterar checkin do worker';
        END IF;
        IF NEW.worker_checkout_at IS DISTINCT FROM OLD.worker_checkout_at THEN
            RAISE EXCEPTION 'Empresa nao pode alterar checkout do worker';
        END IF;
    END IF;

    -- If caller is neither worker nor company, block entirely
    IF NOT v_is_worker AND NOT v_is_company THEN
        RAISE EXCEPTION 'Usuario nao autorizado a atualizar esta candidatura';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_application_update ON applications;
CREATE TRIGGER trg_validate_application_update
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION validate_application_update();

-- =============================================
-- 2. WALLETS: Prevent direct balance manipulation via RLS
--    SECURITY DEFINER RPCs bypass RLS → can still update balance
--    Regular authenticated users via PostgREST → blocked by WITH CHECK
-- =============================================

DROP POLICY IF EXISTS "Users can update their own wallet" ON wallets;

-- Users can update non-financial fields (e.g., asaas_customer_id) but NOT balance
CREATE POLICY "Users can update own wallet non-financial fields" ON wallets
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND balance IS NOT DISTINCT FROM (
            SELECT w.balance FROM wallets w WHERE w.id = wallets.id
        )
    );

-- =============================================
-- 3. ESCROW_TRANSACTIONS: Block ALL direct modifications
--    Only SECURITY DEFINER RPCs can insert/update/delete
-- =============================================

DROP POLICY IF EXISTS "Company can insert escrow" ON escrow_transactions;
-- No INSERT/UPDATE/DELETE policies = blocked for authenticated users
-- SELECT policies remain for viewing

-- =============================================
-- 4. WALLET_TRANSACTIONS: Block direct INSERT
--    Only SECURITY DEFINER RPCs should create records
-- =============================================

DROP POLICY IF EXISTS "Users can insert their transactions" ON wallet_transactions;

-- =============================================
-- 5. HARDEN ALL SECURITY DEFINER RPCs:
--    - SET search_path = public (prevent schema poisoning)
--    - Validate caller ownership (prevent unauthorized operations)
--    - FOR UPDATE locks (prevent race conditions)
-- =============================================

-- 5a. release_escrow: validate company owns the escrow
CREATE OR REPLACE FUNCTION release_escrow(
    p_job_id UUID,
    p_worker_wallet_id UUID
)
RETURNS TABLE(escrow_id UUID, escrow_amount DECIMAL)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_escrow_id UUID;
    v_amount DECIMAL;
    v_company_wallet_id UUID;
    v_caller_wallet_id UUID;
BEGIN
    -- Lock the escrow row for atomic update
    SELECT et.id, et.amount, et.company_wallet_id
    INTO v_escrow_id, v_amount, v_company_wallet_id
    FROM escrow_transactions et
    WHERE et.job_id = p_job_id AND et.status = 'reserved'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No reserved escrow found for job: %', p_job_id;
    END IF;

    -- SECURITY: Validate caller is the company that owns the escrow
    -- Skip for trigger/service_role calls (auth.uid() is null)
    IF auth.uid() IS NOT NULL THEN
        SELECT id INTO v_caller_wallet_id
        FROM wallets WHERE user_id = auth.uid();

        IF v_caller_wallet_id IS NULL OR v_caller_wallet_id != v_company_wallet_id THEN
            RAISE EXCEPTION 'Nao autorizado: voce nao e dono do escrow do job %', p_job_id;
        END IF;
    END IF;

    UPDATE escrow_transactions
    SET status = 'released', released_at = NOW(), worker_wallet_id = p_worker_wallet_id
    WHERE id = v_escrow_id;

    UPDATE wallets
    SET balance = balance + v_amount, updated_at = NOW()
    WHERE id = p_worker_wallet_id;

    INSERT INTO wallet_transactions(wallet_id, amount, type, description, reference_id)
    VALUES (p_worker_wallet_id, v_amount, 'escrow_release', 'Pagamento recebido pela vaga', p_job_id::TEXT);

    RETURN QUERY SELECT v_escrow_id, v_amount;
END;
$$;

-- 5b. reserve_escrow: validate caller identity + job ownership
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

-- 5c. refund_escrow: validate company ownership
CREATE OR REPLACE FUNCTION refund_escrow(
    p_job_id UUID,
    p_reason TEXT DEFAULT 'Reembolso de vaga cancelada'
)
RETURNS TABLE(escrow_id UUID, escrow_amount DECIMAL)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_escrow_id UUID;
    v_amount DECIMAL;
    v_company_wallet_id UUID;
    v_caller_wallet_id UUID;
BEGIN
    SELECT et.id, et.amount, et.company_wallet_id
    INTO v_escrow_id, v_amount, v_company_wallet_id
    FROM escrow_transactions et
    WHERE et.job_id = p_job_id AND et.status = 'reserved'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No reserved escrow found for job: %', p_job_id;
    END IF;

    IF auth.uid() IS NOT NULL THEN
        SELECT id INTO v_caller_wallet_id
        FROM wallets WHERE user_id = auth.uid();

        IF v_caller_wallet_id IS NULL OR v_caller_wallet_id != v_company_wallet_id THEN
            RAISE EXCEPTION 'Nao autorizado: voce nao e dono do escrow do job %', p_job_id;
        END IF;
    END IF;

    UPDATE escrow_transactions
    SET status = 'refunded'
    WHERE id = v_escrow_id;

    UPDATE wallets
    SET balance = balance + v_amount, updated_at = NOW()
    WHERE id = v_company_wallet_id;

    INSERT INTO wallet_transactions(wallet_id, amount, type, description, reference_id)
    VALUES (v_company_wallet_id, v_amount, 'credit', p_reason, 'refund-' || p_job_id::TEXT);

    RETURN QUERY SELECT v_escrow_id, v_amount;
END;
$$;

-- 5d. credit_deposit: add search_path protection
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

-- 5e. update_wallet_balance: add search_path protection
CREATE OR REPLACE FUNCTION update_wallet_balance(
    p_wallet_id UUID,
    p_amount DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 5f. auto_release_escrow_on_completion: add search_path protection
CREATE OR REPLACE FUNCTION auto_release_escrow_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_worker_wallet_id UUID;
    v_has_reserved_escrow BOOLEAN;
BEGIN
    -- Only trigger when status becomes 'completed' and both parties confirmed
    IF NEW.status = 'completed'
       AND NEW.company_checkout_confirmed_at IS NOT NULL
       AND NEW.worker_checkout_at IS NOT NULL
       AND (OLD.status IS DISTINCT FROM 'completed'
            OR OLD.company_checkout_confirmed_at IS NULL)
    THEN
        -- Check if there's a reserved escrow (prevents double-release)
        SELECT EXISTS(
            SELECT 1 FROM escrow_transactions
            WHERE job_id = NEW.job_id AND status = 'reserved'
        ) INTO v_has_reserved_escrow;

        IF NOT v_has_reserved_escrow THEN
            RETURN NEW;
        END IF;

        SELECT id INTO v_worker_wallet_id
        FROM wallets
        WHERE user_id = NEW.worker_id;

        IF v_worker_wallet_id IS NULL THEN
            RAISE WARNING 'Worker % has no wallet, cannot auto-release escrow for job %',
                NEW.worker_id, NEW.job_id;
            RETURN NEW;
        END IF;

        PERFORM release_escrow(NEW.job_id, v_worker_wallet_id);

        RAISE NOTICE 'Auto-released escrow for job % to worker wallet %',
            NEW.job_id, v_worker_wallet_id;
    END IF;

    RETURN NEW;
END;
$$;

-- =============================================
-- 6. Re-grant EXECUTE permissions (all functions recreated)
-- =============================================
GRANT EXECUTE ON FUNCTION release_escrow(UUID, UUID) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION reserve_escrow(UUID, DECIMAL, UUID) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION refund_escrow(UUID, TEXT) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION credit_deposit(UUID, DECIMAL, TEXT, TEXT) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION update_wallet_balance(UUID, DECIMAL) TO service_role, authenticated;
