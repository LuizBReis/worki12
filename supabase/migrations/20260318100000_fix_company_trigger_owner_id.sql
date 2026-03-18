-- Migration: Fix company signup trigger to set owner_id = user.id
--
-- Bug: The auth trigger that creates a company row on signup does NOT set owner_id.
-- This causes the RLS UPDATE policy (owner_id = auth.uid()) to fail during onboarding.
-- The "Companies can update own profile by id" fallback policy (id = auth.uid()) was added
-- but the upsert operation first checks the original USING(owner_id = auth.uid())
-- which fails because owner_id is NULL.
--
-- Fix:
-- 1. Replace the signup trigger to always set owner_id = NEW.id
-- 2. Backfill any existing companies where owner_id IS NULL

-- =============================================
-- 1. Backfill owner_id for existing companies
-- =============================================
UPDATE companies SET owner_id = id WHERE owner_id IS NULL;

-- =============================================
-- 2. Replace the trigger function to set owner_id
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.raw_user_meta_data ->> 'user_type') = 'hire' THEN
    INSERT INTO public.companies (id, owner_id, email, name, onboarding_completed)
    VALUES (NEW.id, NEW.id, NEW.email, '', false)
    ON CONFLICT (id) DO UPDATE SET owner_id = COALESCE(companies.owner_id, NEW.id);
  ELSE
    INSERT INTO public.workers (id, email, full_name, onboarding_completed)
    VALUES (NEW.id, NEW.email, '', false)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
