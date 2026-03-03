-- Add Stripe columns to workers and companies tables
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_workers_stripe_account_id ON public.workers(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_companies_stripe_customer_id ON public.companies(stripe_customer_id);
