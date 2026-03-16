-- Migration: Auto-atualizar rating_average e reviews_count do worker ao receber review
-- File: supabase/migrations/20260312200000_auto_update_worker_rating.sql

-- 1. Adicionar coluna reviews_count se não existir (rating_average já existe)
ALTER TABLE workers
    ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0 NOT NULL;

-- 2. Inicializar reviews_count para workers existentes baseado na tabela reviews
UPDATE workers w
SET reviews_count = (
    SELECT COUNT(*) FROM reviews r WHERE r.reviewed_id = w.id
);

-- 3. Inicializar rating_average para workers existentes baseado na tabela reviews
UPDATE workers w
SET rating_average = (
    SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.reviewed_id = w.id
)
WHERE EXISTS (SELECT 1 FROM reviews r WHERE r.reviewed_id = w.id);

-- 4. Constraint de unicidade: uma empresa não pode avaliar o mesmo worker no mesmo job
ALTER TABLE reviews
    ADD CONSTRAINT reviews_unique_per_job
    UNIQUE (job_id, reviewer_id, reviewed_id);

-- 5. Constraint: reviewer e reviewed não podem ser a mesma pessoa
ALTER TABLE reviews
    ADD CONSTRAINT reviews_no_self_review
    CHECK (reviewer_id <> reviewed_id);

-- 6. Função trigger para atualizar rating do worker
CREATE OR REPLACE FUNCTION update_worker_rating_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
END;
$$;

-- 7. Trigger AFTER INSERT
DROP TRIGGER IF EXISTS trg_update_worker_rating ON reviews;
CREATE TRIGGER trg_update_worker_rating
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_worker_rating_on_review();
