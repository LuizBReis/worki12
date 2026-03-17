-- Migration: Corrigir acesso anonimo nas tabelas applications e companies
-- Issue 1: applications permite SELECT anonimo (expoe worker_id, job_id, status)
-- Issue 2: companies expoe CNPJ para usuarios anonimos
--
-- Root cause: Supabase concede SELECT ao role anon por padrao no schema public.
-- Mesmo com RLS habilitado e policies TO authenticated, o anon consegue ler
-- linhas se nao houver policy explicitamente negando (RLS sem policy = deny,
-- mas o GRANT no schema pode bypassar dependendo da configuracao).
--
-- Fix: Revogar SELECT do role anon nestas tabelas + garantir RLS ativo
-- + FORCE ROW LEVEL SECURITY (aplica RLS mesmo para o owner da tabela)

-- =============================================
-- 1. APPLICATIONS: Bloquear acesso anonimo
-- =============================================

-- Garantir RLS habilitado
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Forcar RLS para o owner da tabela tambem
ALTER TABLE applications FORCE ROW LEVEL SECURITY;

-- Revogar acesso do role anon
REVOKE ALL ON applications FROM anon;

-- Garantir que authenticated ainda tem acesso via PostgREST
GRANT SELECT, INSERT, UPDATE ON applications TO authenticated;

-- =============================================
-- 2. COMPANIES: Bloquear acesso anonimo (proteger CNPJ)
-- =============================================

-- Garantir RLS habilitado
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Forcar RLS para o owner da tabela tambem
ALTER TABLE companies FORCE ROW LEVEL SECURITY;

-- Revogar acesso do role anon
REVOKE ALL ON companies FROM anon;

-- Garantir que authenticated ainda tem acesso via PostgREST
GRANT SELECT, INSERT, UPDATE ON companies TO authenticated;

-- =============================================
-- 3. Proteger tambem workers e jobs (mesma vulnerabilidade potencial)
-- =============================================

-- Workers
ALTER TABLE workers FORCE ROW LEVEL SECURITY;
REVOKE ALL ON workers FROM anon;
GRANT SELECT, INSERT, UPDATE ON workers TO authenticated;

-- Jobs
ALTER TABLE jobs FORCE ROW LEVEL SECURITY;
REVOKE ALL ON jobs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON jobs TO authenticated;
