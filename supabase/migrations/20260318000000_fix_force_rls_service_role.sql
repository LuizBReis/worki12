-- Migration: Fix FORCE RLS blocking service_role and fix trigger owner_id
--
-- Bug 1: FORCE ROW LEVEL SECURITY blocked service_role from accessing tables
--         because REVOKE ALL removed permissions from postgres/service_role.
-- Fix: Remove FORCE RLS (regular RLS is sufficient), grant ALL to service_role.
--
-- Bug 2: Company records created by trigger have owner_id = NULL,
--         which violates the RLS INSERT/UPDATE policy (owner_id = auth.uid()).
-- Fix: Add fallback RLS policy that also allows id = auth.uid() for companies.

-- =============================================
-- 1. Remove FORCE RLS (regular RLS still enforced for anon/authenticated)
-- =============================================
ALTER TABLE workers NO FORCE ROW LEVEL SECURITY;
ALTER TABLE companies NO FORCE ROW LEVEL SECURITY;
ALTER TABLE applications NO FORCE ROW LEVEL SECURITY;
ALTER TABLE jobs NO FORCE ROW LEVEL SECURITY;

-- =============================================
-- 2. Grant service_role full access (bypasses RLS by default)
-- =============================================
GRANT ALL ON workers TO service_role;
GRANT ALL ON companies TO service_role;
GRANT ALL ON jobs TO service_role;
GRANT ALL ON applications TO service_role;
GRANT ALL ON wallets TO service_role;

-- =============================================
-- 3. Add fallback UPDATE policy for companies using id = auth.uid()
--    This handles records where owner_id is NULL (created by trigger)
-- =============================================
DO $$ BEGIN
  DROP POLICY IF EXISTS "Companies can update own profile by id" ON companies;
END $$;

CREATE POLICY "Companies can update own profile by id"
ON companies FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Also add fallback INSERT policy
DO $$ BEGIN
  DROP POLICY IF EXISTS "Companies can insert own profile by id" ON companies;
END $$;

CREATE POLICY "Companies can insert own profile by id"
ON companies FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());
