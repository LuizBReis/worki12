-- Fix: handle_new_user trigger crashes with "column workers.email does not exist"
-- The workers table does NOT have an email column. Remove it from the INSERT.
-- Companies table HAS an email column, so keep it there.

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
    INSERT INTO public.workers (id, full_name, onboarding_completed)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), false)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
