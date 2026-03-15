-- SEC-02: Restringir UPDATE de wallets para apenas colunas nao-financeiras
-- Em vez de subquery confusa, usar GRANT de coluna para controle explicito

-- Remover politica atual com subquery confusa
DROP POLICY IF EXISTS "Users can update own wallet non-financial fields" ON wallets;
DROP POLICY IF EXISTS "Users can update their own wallet" ON wallets;

-- Revogar UPDATE geral e conceder apenas em colunas seguras
REVOKE UPDATE ON wallets FROM authenticated;
GRANT UPDATE (asaas_customer_id) ON wallets TO authenticated;

-- Politica simples: usuario so pode atualizar sua propria wallet
CREATE POLICY "Users can update own wallet safe fields" ON wallets
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- service_role precisa UPDATE total para RPCs
GRANT UPDATE ON wallets TO service_role;
