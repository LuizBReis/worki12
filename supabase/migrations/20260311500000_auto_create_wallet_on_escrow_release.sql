-- SEC-07: Criar wallet automaticamente se worker nao tiver ao liberar escrow
-- Em vez de RAISE WARNING e silenciosamente falhar, criar wallet e prosseguir

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

        -- Auto-create wallet if worker doesn't have one
        IF v_worker_wallet_id IS NULL THEN
            INSERT INTO wallets (user_id, balance, user_type)
            VALUES (NEW.worker_id, 0, 'worker')
            RETURNING id INTO v_worker_wallet_id;

            RAISE NOTICE 'Auto-created wallet for worker % (wallet %)',
                NEW.worker_id, v_worker_wallet_id;
        END IF;

        PERFORM release_escrow(NEW.job_id, v_worker_wallet_id);

        RAISE NOTICE 'Auto-released escrow for job % to worker wallet %',
            NEW.job_id, v_worker_wallet_id;
    END IF;

    RETURN NEW;
END;
$$;
