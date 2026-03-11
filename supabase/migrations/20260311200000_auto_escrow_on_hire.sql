-- Migration: Auto-reserve escrow when company hires a worker
-- When application status changes to 'hired', automatically reserve escrow
-- using the job's budget. If company has insufficient balance, the hire fails.

CREATE OR REPLACE FUNCTION auto_reserve_escrow_on_hire()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_job_budget DECIMAL;
    v_company_id UUID;
BEGIN
    -- Only trigger when status changes TO 'hired'
    IF NEW.status = 'hired' AND (OLD.status IS DISTINCT FROM 'hired') THEN
        -- Get job budget and company owner
        SELECT budget, company_id INTO v_job_budget, v_company_id
        FROM jobs WHERE id = NEW.job_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Vaga nao encontrada: %', NEW.job_id;
        END IF;

        IF v_job_budget IS NULL OR v_job_budget <= 0 THEN
            RAISE EXCEPTION 'Vaga sem valor definido. Defina o orcamento antes de contratar.';
        END IF;

        -- Reserve escrow atomically
        -- If balance < budget, reserve_escrow raises 'Saldo insuficiente' and the hire is rolled back
        PERFORM reserve_escrow(NEW.job_id, v_job_budget, v_company_id);

        RAISE NOTICE 'Escrow de R$% reservado automaticamente para job % ao contratar worker %',
            v_job_budget, NEW.job_id, NEW.worker_id;
    END IF;

    RETURN NEW;
END;
$$;

-- Use AFTER UPDATE so it fires after validation trigger (trg_validate_application_update)
-- If reserve_escrow fails, the entire transaction rolls back (status stays unchanged)
DROP TRIGGER IF EXISTS trg_auto_reserve_escrow_on_hire ON applications;
CREATE TRIGGER trg_auto_reserve_escrow_on_hire
    AFTER UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION auto_reserve_escrow_on_hire();
