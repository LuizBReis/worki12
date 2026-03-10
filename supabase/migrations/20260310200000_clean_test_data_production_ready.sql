-- Migration: Remove ALL test data and set balances to reflect real Asaas state only
-- After this, wallet balances = only what was deposited via Asaas PIX

-- 1. Delete ALL initial_balance test transactions
DELETE FROM wallet_transactions WHERE type = 'initial_balance';

-- 2. Reset ALL wallet balances to 0
-- Real balances will be rebuilt from actual transactions via asaas-sync
UPDATE wallets SET balance = 0, updated_at = NOW();

-- 3. Recalculate balances from real transactions only (credit, debit, escrow_reserve, escrow_release)
UPDATE wallets SET balance = COALESCE(
    (SELECT SUM(
        CASE
            WHEN wt.type IN ('credit', 'escrow_release') THEN wt.amount
            WHEN wt.type IN ('debit', 'escrow_reserve') THEN -ABS(wt.amount)
            ELSE 0
        END
    ) FROM wallet_transactions wt WHERE wt.wallet_id = wallets.id),
    0
), updated_at = NOW();
