-- SEC-03: Adicionar coluna status em wallet_transactions para rastreabilidade de saques
-- Permite marcar transacoes como pending_transfer, completed ou failed

ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed'
CHECK (status IN ('pending_transfer', 'completed', 'failed'));
