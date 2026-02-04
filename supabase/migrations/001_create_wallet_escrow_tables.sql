-- Migration: Create wallet and escrow system tables
-- Run this in Supabase SQL Editor

-- 1. Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) DEFAULT 0,
    user_type TEXT NOT NULL CHECK (user_type IN ('company', 'worker')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Create escrow_transactions table
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id),
    amount DECIMAL(10,2) NOT NULL,
    company_wallet_id UUID NOT NULL REFERENCES wallets(id),
    worker_wallet_id UUID REFERENCES wallets(id),
    status TEXT NOT NULL CHECK (status IN ('reserved', 'released', 'refunded')) DEFAULT 'reserved',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    released_at TIMESTAMPTZ
);

-- 3. Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'escrow_reserve', 'escrow_release', 'initial_balance')),
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_escrow_job_id ON escrow_transactions(job_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet_id ON wallet_transactions(wallet_id);

-- 5. Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for wallets
CREATE POLICY "Users can view their own wallet" ON wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- 7. RLS Policies for escrow_transactions
CREATE POLICY "Company can view their escrow" ON escrow_transactions
    FOR SELECT USING (
        company_wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
    );

CREATE POLICY "Worker can view their escrow" ON escrow_transactions
    FOR SELECT USING (
        worker_wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
    );

-- 8. RLS Policies for wallet_transactions
CREATE POLICY "Users can view their transactions" ON wallet_transactions
    FOR SELECT USING (
        wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
    );

-- 9. Initialize wallets for existing companies with R$500
INSERT INTO wallets (user_id, balance, user_type)
SELECT id, 500.00, 'company' FROM companies
ON CONFLICT (user_id) DO NOTHING;

-- 10. Initialize wallets for existing workers with R$0
INSERT INTO wallets (user_id, balance, user_type)
SELECT id, 0.00, 'worker' FROM workers
ON CONFLICT (user_id) DO NOTHING;

-- 11. Add initial balance transactions for companies
INSERT INTO wallet_transactions (wallet_id, amount, type, description)
SELECT w.id, 500.00, 'initial_balance', 'Saldo inicial para testes'
FROM wallets w
WHERE w.user_type = 'company'
AND NOT EXISTS (
    SELECT 1 FROM wallet_transactions wt 
    WHERE wt.wallet_id = w.id AND wt.type = 'initial_balance'
);
