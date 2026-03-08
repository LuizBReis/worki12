-- Reset test balances for production
-- The initial migration gave R$500 to existing test companies
-- This ensures all balances reflect real deposits only

UPDATE wallets SET balance = 0 WHERE balance = 500.00 AND user_type = 'company'
  AND NOT EXISTS (
    SELECT 1 FROM wallet_transactions wt
    WHERE wt.wallet_id = wallets.id
    AND wt.type NOT IN ('initial_balance')
  );

-- Remove test initial_balance transactions
DELETE FROM wallet_transactions WHERE type = 'initial_balance';
