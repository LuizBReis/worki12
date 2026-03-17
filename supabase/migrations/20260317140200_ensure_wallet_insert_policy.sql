-- Migration: Garantir que a policy de INSERT em wallets permite criacao durante onboarding
-- Risk: LOW
-- Backup required before production deploy: NO
--
-- DOWN (rollback):
-- (nenhuma acao necessaria - policy ja existia)

-- UP (apply):

-- Garantir que a policy de INSERT existe (pode ter sido criada em 20260308000000)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'wallets'
        AND policyname = 'Users can insert their own wallet'
    ) THEN
        CREATE POLICY "Users can insert their own wallet" ON wallets
            FOR INSERT TO authenticated
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
