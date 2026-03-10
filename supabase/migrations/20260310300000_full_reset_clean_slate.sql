-- Migration: FULL RESET - Clean slate for production-like testing
-- Removes ALL financial data: transactions, escrows, wallet balances

-- 1. Delete ALL wallet transactions (every single one)
DELETE FROM wallet_transactions;

-- 2. Delete ALL escrow transactions
DELETE FROM escrow_transactions;

-- 3. Reset ALL wallet balances to zero
UPDATE wallets SET balance = 0, updated_at = NOW();
