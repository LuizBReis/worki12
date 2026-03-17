-- Migration: Adicionar coluna city a tabela companies
-- Risk: LOW
-- Backup required before production deploy: NO
--
-- DOWN (rollback):
-- ALTER TABLE companies DROP COLUMN IF EXISTS city;

-- UP (apply):
ALTER TABLE companies ADD COLUMN IF NOT EXISTS city TEXT;
