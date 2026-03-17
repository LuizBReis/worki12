-- Migration: Criar RPC increment_worker_view e coluna profile_views
-- Risk: LOW
-- Backup required before production deploy: NO
--
-- DOWN (rollback):
-- DROP FUNCTION IF EXISTS increment_worker_view(UUID);
-- ALTER TABLE workers DROP COLUMN IF EXISTS profile_views;

-- UP (apply):

-- Adicionar coluna profile_views se nao existir
ALTER TABLE workers ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;

-- Criar funcao RPC para incrementar views
-- O frontend chama com parametro worker_id (nao worker_uuid)
CREATE OR REPLACE FUNCTION increment_worker_view(worker_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE workers
    SET profile_views = COALESCE(profile_views, 0) + 1
    WHERE id = worker_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Garantir permissoes de execucao
GRANT EXECUTE ON FUNCTION increment_worker_view(UUID) TO service_role, authenticated;
