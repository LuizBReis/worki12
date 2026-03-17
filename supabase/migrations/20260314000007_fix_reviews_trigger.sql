-- Fix reviews: drop old trigger referencing non-existent worker_profiles table
-- The trigger likely comes from old Prisma schema and tries to update a table that no longer exists

-- Drop any triggers that might reference worker_profiles
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tgname, relname
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'reviews'
        AND NOT t.tgisinternal
    ) LOOP
        RAISE NOTICE 'Found trigger on reviews: %', r.tgname;
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON reviews', r.tgname);
    END LOOP;
END $$;

-- Recreate only the valid trigger
CREATE OR REPLACE FUNCTION update_worker_rating_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update the worker's rating average and count
    UPDATE workers
    SET
        rating_average = (
            SELECT ROUND(AVG(rating)::numeric, 1)
            FROM reviews
            WHERE reviewed_id = NEW.reviewed_id
        ),
        reviews_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE reviewed_id = NEW.reviewed_id
        )
    WHERE id = NEW.reviewed_id;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Don't block review insert if worker update fails
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_worker_rating
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_worker_rating_on_review();
