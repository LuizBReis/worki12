-- Migration: Garantir que a policy de SELECT em workers permite qualquer usuario autenticado
-- Risk: LOW
-- Backup required before production deploy: NO
--
-- DOWN (rollback):
-- DROP POLICY IF EXISTS "Anyone authenticated can view worker profiles" ON workers;

-- UP (apply):

-- Remover policies de SELECT restritivas que possam existir
DROP POLICY IF EXISTS "Workers can view their own profile" ON workers;
DROP POLICY IF EXISTS "Anyone authenticated can view worker profiles" ON workers;

-- Recriar policy permissiva (pode ja existir como "Authenticated users can view worker profiles")
-- Nao dropa essa porque ela ja e correta, mas cria uma redundante segura
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'workers'
        AND policyname = 'Authenticated users can view worker profiles'
    ) THEN
        CREATE POLICY "Authenticated users can view worker profiles"
        ON workers FOR SELECT TO authenticated
        USING (true);
    END IF;
END $$;
