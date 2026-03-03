-- Migration: Add Asaas fields for virtual wallet subaccounts
-- Run this in Supabase SQL Editor

ALTER TABLE wallets
ADD COLUMN asaas_wallet_id TEXT,
ADD COLUMN asaas_api_key TEXT,
ADD COLUMN asaas_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_wallets_asaas_wallet_id ON wallets(asaas_wallet_id);
