-- Seed para testes E2E — executar contra Supabase local APENAS
-- NUNCA executar contra banco de producao

-- Criar vaga aberta para testes de candidatura
INSERT INTO jobs (id, title, description, budget, status, company_id, start_date, location)
VALUES (
    'e2e00000-0000-0000-0000-000000000001'::uuid,
    'Garcom para Evento E2E',
    'Vaga de teste para E2E',
    150.00,
    'open',
    'e2e00000-0000-0000-0000-000000000002'::uuid,
    NOW() + INTERVAL '7 days',
    'Sao Paulo, SP'
)
ON CONFLICT (id) DO NOTHING;
