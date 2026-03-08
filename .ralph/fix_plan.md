# Worki - Ralph Fix Plan (MVP Sprint)

## Phase 1: STRIPE-* (Remover Stripe completamente)

- [x] **STRIPE-01**: Deletar todas as edge functions Stripe (`stripe-connect/`, `stripe-deposit/`, `stripe-payout/`, `stripe-transfer/`, `stripe-webhook/`) e o client shared (`_shared/stripe.ts`)
- [x] **STRIPE-02**: Remover pacotes `@stripe/react-stripe-js` e `@stripe/stripe-js` do `frontend/package.json` e rodar `npm install`
- [x] **STRIPE-03**: Remover campos Stripe dos types (`stripe_account_id`, `stripe_onboarding_completed`, `stripe_customer_id` em `frontend/src/types/index.ts`)
- [x] **STRIPE-04**: Criar migration para DROP colunas Stripe do banco (`workers.stripe_account_id`, `workers.stripe_onboarding_completed`, `companies.stripe_customer_id`) e remover indexes
- [x] **STRIPE-05**: Remover referências Stripe de docs/config (`CLAUDE.md`, `.ralph/PROMPT.md`, `.ralph/AGENT.md`, `test-templates.sh`, `.env.example`)
- [x] **STRIPE-06**: Deletar edge functions stub deprecated (`asaas-onboard/`, `asaas-account-status/`) e remover referências em `test-templates.sh`

## Phase 2: ASAAS-* (Validar fluxo de pagamento completo)

- [x] **ASAAS-01**: Auditar `asaas-deposit` - verificar que cria customer no master account, gera cobrança PIX, salva `asaas_customer_id` na wallet
- [x] **ASAAS-02**: Auditar `asaas-webhook` - verificar IP whitelist, token validation, `credit_deposit` RPC com deduplicação
- [x] **ASAAS-03**: Auditar `asaas-checkout` - verificar que chama `release_escrow` RPC atomicamente, credita worker
- [x] **ASAAS-04**: Auditar `asaas-withdraw` - verificar dedução atômica de saldo, chamada `/transfers` Asaas, rollback em caso de falha
- [x] **ASAAS-05**: Auditar `asaas-sync` - verificar sync manual de depósitos pendentes
- [x] **ASAAS-06**: Verificar consistência de validação de valores (min/max) entre deposit, withdraw e frontend

## Phase 3: MVP-* (Funcionalidades faltantes para lançamento)

- [x] **MVP-01**: Verificar fluxo completo de job: criar → aplicar → contratar → completar → pagar → avaliar (testar cada transição de status)
- [x] **MVP-02**: Verificar que tabela `notifications` existe e NotificationContext funciona sem fallback silencioso
- [x] **MVP-03**: Remover saldo inicial de teste R$500 da migration `001_create_wallet_escrow_tables.sql` (ou criar migration corretiva)
- [x] **MVP-04**: Adicionar validação de input em todos os formulários críticos (valores monetários, campos obrigatórios)
- [x] **MVP-05**: Verificar que todas as RLS policies permitem operações legítimas (não bloqueiam fluxos normais)
- [x] **MVP-06**: Adicionar páginas de Termos de Uso e Política de Privacidade (placeholder)
- [x] **MVP-07**: Adicionar meta tags SEO básicas e favicon correto
- [x] **MVP-08**: Criar config de deploy (`vercel.json` ou equivalente) com redirects SPA

## Phase 4: QUALITY-* (Qualidade e testes)

- [ ] **QUALITY-01**: Expandir testes do walletService (mock Supabase, testar deposit/withdraw/escrow flows)
- [ ] **QUALITY-02**: Adicionar testes para fluxo de job (useJobApplication hook)
- [x] **QUALITY-03**: Verificar que `npm run build` e `npm run lint` passam limpos após todas mudanças
- [x] **QUALITY-04**: Limpar warnings restantes de `react-hooks/exhaustive-deps`

## Phase 5: DOC-* (Documentação)

- [x] **DOC-01**: Atualizar README.md com arquitetura atual e instruções de setup
- [x] **DOC-02**: Documentar todos os endpoints de edge functions (método, params, resposta)
- [x] **DOC-03**: Documentar schema do banco e relacionamentos

## Notes
- Sempre verificar `npm run build` após cada mudança
- Commits em português, sem Co-Authored-By
- Foco: remover Stripe primeiro, depois validar Asaas, depois MVP features
- Cada loop deve completar UMA task
