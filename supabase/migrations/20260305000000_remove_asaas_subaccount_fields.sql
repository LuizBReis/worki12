-- Migration: Remove Asaas sub-account fields from wallets
-- Sub-accounts are no longer used. All payments flow through a single master wallet.
-- The asaas_customer_id is kept as it's used to track customers on the master account.

-- Drop the index first
DROP INDEX IF EXISTS idx_wallets_asaas_wallet_id;

-- Remove sub-account specific columns
ALTER TABLE wallets DROP COLUMN IF EXISTS asaas_wallet_id;
ALTER TABLE wallets DROP COLUMN IF EXISTS asaas_api_key;
ALTER TABLE wallets DROP COLUMN IF EXISTS asaas_account_status;
