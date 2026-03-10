# Worki - Production Readiness Plan

## Phase 1: INFRA-* (Infraestrutura de producao)

- [x] **INFRA-01**: Linkar projeto Supabase e fazer push das migrations
- [x] **INFRA-02**: Corrigir CORS em `_shared/asaas.ts` - exigir `CORS_ORIGIN` em producao
- [x] **INFRA-03**: Corrigir fallback CPF fake no `asaas-deposit` - exigir CPF/CNPJ valido
- [x] **INFRA-04**: Adicionar rate limiting basico nas edge functions criticas
- [x] **INFRA-05**: Configurar `ASAAS_ENVIRONMENT` toggle para facil troca sandbox→production
- [x] **INFRA-06**: Criar script de deploy com checklist de env vars

## Phase 2: AUTH-* (Autenticacao e seguranca)

- [x] **AUTH-01**: Criar pagina "Esqueci minha senha"
- [x] **AUTH-02**: Criar pagina de redefinicao de senha
- [x] **AUTH-03**: Adicionar rotas `/esqueci-senha` e `/redefinir-senha` no App.tsx
- [x] **AUTH-04**: Habilitar confirmacao de email no Supabase (config manual - feito pelo usuario)
- [x] **AUTH-05**: Adicionar link "Esqueci minha senha" na pagina de Login

## Phase 3: MONITOR-* (Monitoramento e erros)

- [x] **MONITOR-01**: Instalar `@sentry/react` no frontend
- [x] **MONITOR-02**: Configurar Sentry no `main.tsx` com DSN via env var
- [x] **MONITOR-03**: Integrar ErrorBoundary com Sentry
- [x] **MONITOR-04**: Adicionar Sentry em catch blocks criticos

## Phase 4: EMAIL-* (Notificacoes por email)

- [x] **EMAIL-01**: Criar edge function `send-notification`
- [x] **EMAIL-02**: Disparar email quando worker e contratado
- [x] **EMAIL-03**: Disparar email quando pagamento e recebido
- [x] **EMAIL-04**: Disparar email quando deposito e confirmado
- [x] **EMAIL-05**: Adicionar `RESEND_API_KEY` ao `.env.example`

## Phase 5: ADMIN-* (Painel administrativo)

- [x] **ADMIN-01**: Criar pagina `/admin` com autenticacao por email whitelist
- [x] **ADMIN-02**: Dashboard admin: total usuarios, total jobs, total transacoes, saldo plataforma
- [x] **ADMIN-03**: Lista de transacoes recentes com filtro por tipo/status
- [x] **ADMIN-04**: Lista de usuarios (workers + companies) via edge function admin-data
- [x] **ADMIN-05**: Lista de escrows pendentes via edge function admin-data

## Phase 6: UX-* (Experiencia do usuario)

- [x] **UX-01**: Criar pagina de Ajuda/Suporte com FAQ basico e link de contato
- [x] **UX-02**: Adicionar rota `/ajuda` no App.tsx
- [x] **UX-03**: Melhorar Termos de Uso com clausulas completas (escrow, taxas, disputas, LGPD)
- [x] **UX-04**: Melhorar Politica de Privacidade com detalhes de retencao e direitos LGPD

## Phase 7: QUALITY-* (Testes finais)

- [x] **QUALITY-01**: Expandir testes do walletService com mocks (18 testes passando)
- [ ] **QUALITY-02**: Adicionar testes para paginas de auth
- [x] **QUALITY-03**: Build + lint limpos apos todas mudancas
- [x] **QUALITY-04**: Verificar TODAS as rotas (31 testes passando, build limpo)

## Notes
- NAO alterar nada relacionado a Asaas API/endpoints (apenas CORS e validacao)
- Asaas permanece em sandbox ate config final
- Commits em portugues, sem Co-Authored-By
- Push cada commit imediatamente
- Verificar build apos cada mudanca

## Remaining:
- QUALITY-02: Testes de paginas auth (nice-to-have)
