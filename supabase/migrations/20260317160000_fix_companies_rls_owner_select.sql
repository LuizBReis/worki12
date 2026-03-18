-- Fix: Company owner cannot read their own company row after FORCE ROW LEVEL SECURITY
-- The previous migration applied FORCE RLS but no SELECT policy existed for the owner.
-- Also: jobs need public SELECT for browsing, and applications need proper policies.

-- =============================================
-- COMPANIES: Owner can read/update their own company
-- =============================================
DO $$ BEGIN
  -- Drop overly restrictive policies if they exist
  DROP POLICY IF EXISTS "Companies are viewable by owner" ON companies;
  DROP POLICY IF EXISTS "Company owner can view own company" ON companies;
  DROP POLICY IF EXISTS "Company owner can update own company" ON companies;
  DROP POLICY IF EXISTS "Authenticated can view companies" ON companies;
  DROP POLICY IF EXISTS "Authenticated can insert companies" ON companies;
END $$;

-- Owner can SELECT their own company
CREATE POLICY "Company owner can view own company"
ON companies FOR SELECT TO authenticated
USING (owner_id = auth.uid());

-- Any authenticated user can view companies (for public profiles, job listings)
CREATE POLICY "Authenticated users can view companies"
ON companies FOR SELECT TO authenticated
USING (true);

-- Owner can INSERT their company (onboarding)
CREATE POLICY "Users can create their company"
ON companies FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Owner can UPDATE their company
CREATE POLICY "Company owner can update own company"
ON companies FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- =============================================
-- JOBS: Any authenticated user can view (for browsing)
-- =============================================
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can view open jobs" ON jobs;
  DROP POLICY IF EXISTS "Authenticated can view jobs" ON jobs;
  DROP POLICY IF EXISTS "Company owner can manage jobs" ON jobs;
END $$;

-- All authenticated can view jobs (workers need to browse)
CREATE POLICY "Authenticated can view jobs"
ON jobs FOR SELECT TO authenticated
USING (true);

-- Company owner can INSERT/UPDATE/DELETE their jobs
CREATE POLICY "Company owner can manage jobs"
ON jobs FOR ALL TO authenticated
USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()))
WITH CHECK (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

-- =============================================
-- APPLICATIONS: Worker sees own, company sees for their jobs
-- =============================================
DO $$ BEGIN
  DROP POLICY IF EXISTS "Workers can view own applications" ON applications;
  DROP POLICY IF EXISTS "Companies can view applications for their jobs" ON applications;
  DROP POLICY IF EXISTS "Workers can insert applications" ON applications;
  DROP POLICY IF EXISTS "Workers can update own applications" ON applications;
END $$;

CREATE POLICY "Workers can view own applications"
ON applications FOR SELECT TO authenticated
USING (worker_id = auth.uid());

CREATE POLICY "Companies can view applications for their jobs"
ON applications FOR SELECT TO authenticated
USING (job_id IN (SELECT id FROM jobs WHERE company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())));

CREATE POLICY "Workers can insert applications"
ON applications FOR INSERT TO authenticated
WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Workers can update own applications"
ON applications FOR UPDATE TO authenticated
USING (worker_id = auth.uid());
