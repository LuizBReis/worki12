-- Migration: SEC-02 - Enable RLS on all tables accessed directly by frontend
-- Tables already covered: wallets, escrow_transactions, wallet_transactions, notifications
-- Tables needing RLS: workers, companies, jobs, applications, reviews, job_categories, Conversation, analytics_events

-- =============================================
-- 1. WORKERS TABLE
-- Pattern: workers.id = auth.uid()
-- =============================================
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view any worker profile (needed for job listings, candidate views)
CREATE POLICY "Authenticated users can view worker profiles" ON workers
    FOR SELECT TO authenticated
    USING (true);

-- Workers can update their own profile
CREATE POLICY "Workers can update their own profile" ON workers
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Workers can insert their own profile (onboarding)
CREATE POLICY "Workers can insert their own profile" ON workers
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

-- =============================================
-- 2. COMPANIES TABLE
-- Pattern: companies.id = auth.uid()
-- =============================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view any company profile (needed for job listings)
CREATE POLICY "Authenticated users can view company profiles" ON companies
    FOR SELECT TO authenticated
    USING (true);

-- Companies can update their own profile
CREATE POLICY "Companies can update their own profile" ON companies
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Companies can insert their own profile (onboarding)
CREATE POLICY "Companies can insert their own profile" ON companies
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

-- =============================================
-- 3. JOBS TABLE
-- Pattern: jobs.company_id = auth.uid() for ownership
-- =============================================
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view open jobs (marketplace browsing)
CREATE POLICY "Authenticated users can view jobs" ON jobs
    FOR SELECT TO authenticated
    USING (true);

-- Companies can create their own jobs
CREATE POLICY "Companies can create their own jobs" ON jobs
    FOR INSERT TO authenticated
    WITH CHECK (company_id = auth.uid());

-- Companies can update their own jobs
CREATE POLICY "Companies can update their own jobs" ON jobs
    FOR UPDATE TO authenticated
    USING (company_id = auth.uid())
    WITH CHECK (company_id = auth.uid());

-- Companies can delete their own jobs
CREATE POLICY "Companies can delete their own jobs" ON jobs
    FOR DELETE TO authenticated
    USING (company_id = auth.uid());

-- =============================================
-- 4. APPLICATIONS TABLE
-- Pattern: worker_id = auth.uid() OR job belongs to company
-- =============================================
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Workers can view their own applications
CREATE POLICY "Workers can view their own applications" ON applications
    FOR SELECT TO authenticated
    USING (
        worker_id = auth.uid()
        OR job_id IN (SELECT id FROM jobs WHERE company_id = auth.uid())
    );

-- Workers can create applications
CREATE POLICY "Workers can create applications" ON applications
    FOR INSERT TO authenticated
    WITH CHECK (worker_id = auth.uid());

-- Workers and companies can update applications (status changes)
CREATE POLICY "Participants can update applications" ON applications
    FOR UPDATE TO authenticated
    USING (
        worker_id = auth.uid()
        OR job_id IN (SELECT id FROM jobs WHERE company_id = auth.uid())
    );

-- =============================================
-- 5. REVIEWS TABLE
-- =============================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view reviews (public feedback)
CREATE POLICY "Authenticated users can view reviews" ON reviews
    FOR SELECT TO authenticated
    USING (true);

-- Authenticated users can create reviews (validated by application status in app logic)
CREATE POLICY "Authenticated users can create reviews" ON reviews
    FOR INSERT TO authenticated
    WITH CHECK (reviewer_id = auth.uid());

-- =============================================
-- 6. JOB_CATEGORIES TABLE (read-only reference data)
-- =============================================
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view categories
CREATE POLICY "Authenticated users can view job categories" ON job_categories
    FOR SELECT TO authenticated
    USING (true);

-- =============================================
-- 7. CONVERSATION TABLE (PascalCase - Prisma)
-- Pattern: participants only
-- =============================================
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;

-- Participants can view their conversations
CREATE POLICY "Participants can view conversations" ON "Conversation"
    FOR SELECT TO authenticated
    USING (
        application_uuid IN (
            SELECT id FROM applications
            WHERE worker_id = auth.uid()
               OR job_id IN (SELECT id FROM jobs WHERE company_id = auth.uid())
        )
    );

-- Participants can create conversations
CREATE POLICY "Participants can create conversations" ON "Conversation"
    FOR INSERT TO authenticated
    WITH CHECK (
        application_uuid IN (
            SELECT id FROM applications
            WHERE worker_id = auth.uid()
               OR job_id IN (SELECT id FROM jobs WHERE company_id = auth.uid())
        )
    );

-- =============================================
-- 8. ANALYTICS_EVENTS TABLE
-- =============================================
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own analytics events
CREATE POLICY "Users can insert analytics events" ON analytics_events
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can view their own analytics events
CREATE POLICY "Users can view their own analytics" ON analytics_events
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());
