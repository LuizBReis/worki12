-- Migration: adicionar onboarding_completed em companies
-- Risk: LOW
-- Backup required before production deploy: NO
--
-- DOWN (rollback):
-- ALTER TABLE companies DROP COLUMN IF EXISTS onboarding_completed;

-- UP (apply):
ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL;

-- Marcar companies existentes com dados preenchidos como onboarding completo
UPDATE companies
SET onboarding_completed = TRUE
WHERE name IS NOT NULL AND name <> '' AND name <> '[Empresa Deletada]';
