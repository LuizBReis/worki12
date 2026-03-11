-- Migration: Auto-release escrow when job is completed
-- When both parties confirm (company_checkout_confirmed_at is set and status = completed),
-- automatically release the escrow to the worker's wallet.

CREATE OR REPLACE FUNCTION auto_release_escrow_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_worker_wallet_id UUID;
    v_has_reserved_escrow BOOLEAN;
BEGIN
    -- Only trigger when status becomes 'completed' and company confirmed checkout
    IF NEW.status = 'completed'
       AND NEW.company_checkout_confirmed_at IS NOT NULL
       AND NEW.worker_checkout_at IS NOT NULL
       AND (OLD.status IS DISTINCT FROM 'completed'
            OR OLD.company_checkout_confirmed_at IS NULL)
    THEN
        -- Check if there's a reserved escrow for this job
        SELECT EXISTS(
            SELECT 1 FROM escrow_transactions
            WHERE job_id = NEW.job_id AND status = 'reserved'
        ) INTO v_has_reserved_escrow;

        IF NOT v_has_reserved_escrow THEN
            -- No escrow to release (job might not have had escrow, or already released)
            RETURN NEW;
        END IF;

        -- Get worker's wallet
        SELECT id INTO v_worker_wallet_id
        FROM wallets
        WHERE user_id = NEW.worker_id;

        IF v_worker_wallet_id IS NULL THEN
            RAISE WARNING 'Worker % has no wallet, cannot auto-release escrow for job %',
                NEW.worker_id, NEW.job_id;
            RETURN NEW;
        END IF;

        -- Release escrow atomically (reuses existing RPC logic)
        PERFORM release_escrow(NEW.job_id, v_worker_wallet_id);

        RAISE NOTICE 'Auto-released escrow for job % to worker wallet %',
            NEW.job_id, v_worker_wallet_id;
    END IF;

    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_auto_release_escrow ON applications;
CREATE TRIGGER trg_auto_release_escrow
    AFTER UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION auto_release_escrow_on_completion();
