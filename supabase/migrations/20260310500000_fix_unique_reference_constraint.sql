-- Migration: Fix unique constraint on wallet_transactions.reference_id
-- The old constraint unique_reference_id is on reference_id ALONE,
-- which blocks escrow_reserve + escrow_release from using the same job_id
-- as reference_id for different wallets.
-- The correct constraint is idx_wallet_tx_unique_reference on (wallet_id, reference_id).

-- Drop the incorrect global unique constraint
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS unique_reference_id;

-- Also drop any unique index on reference_id alone
DROP INDEX IF EXISTS unique_reference_id;

-- Ensure the correct composite unique index exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_tx_unique_reference
ON wallet_transactions(wallet_id, reference_id) WHERE reference_id IS NOT NULL;
