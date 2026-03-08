-- Remove all Stripe-related columns and indexes
-- Worki uses Asaas only as payment gateway

-- Drop indexes first
DROP INDEX IF EXISTS idx_workers_stripe_account_id;
DROP INDEX IF EXISTS idx_companies_stripe_customer_id;

-- Drop columns from workers
ALTER TABLE workers
  DROP COLUMN IF EXISTS stripe_account_id,
  DROP COLUMN IF EXISTS stripe_onboarding_completed;

-- Drop columns from companies
ALTER TABLE companies
  DROP COLUMN IF EXISTS stripe_customer_id;
