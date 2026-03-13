-- Migration: Adicionar campos de aceite de TOS em workers e companies
-- File: supabase/migrations/20260312100000_add_tos_acceptance.sql

-- Workers
ALTER TABLE workers
    ADD COLUMN IF NOT EXISTS accepted_tos BOOLEAN DEFAULT FALSE NOT NULL,
    ADD COLUMN IF NOT EXISTS tos_version TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ DEFAULT NULL;

-- Companies
ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS accepted_tos BOOLEAN DEFAULT FALSE NOT NULL,
    ADD COLUMN IF NOT EXISTS tos_version TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ DEFAULT NULL;

-- RLS: as políticas existentes de workers e companies já permitem UPDATE pelo próprio usuário
-- ("Workers can update their own profile" e "Companies can update their own profile")
-- Nenhuma nova política de RLS necessária.
