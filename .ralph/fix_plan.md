# Worki - Production Readiness Plan (Full Audit)

## Phase 1: SEC-* (Seguranca Critica - MUST FIX)

- [x] **SEC-01**: Fix admin-data JWT - comparar token diretamente com SUPABASE_SERVICE_ROLE_KEY ao inves de parsear JWT sem verificar assinatura (supabase/functions/admin-data/index.ts)
- [x] **SEC-02**: Fix wallet update RLS policy - substituir subquery WITH CHECK por trigger de validacao por coluna que bloqueia alteracao direta de balance (supabase/migrations/20260315000000_fix_wallet_update_rls_policy.sql)
- [x] **SEC-03**: Fix withdrawal rollback critico - adicionar registro pending_transfer antes de chamar Asaas, atualizar para confirmed/failed apos resultado (supabase/functions/asaas-withdraw/index.ts)
- [x] **SEC-04**: Add HTML escaping em email templates - funcao escapeHtml aplicada em todos os valores do usuario (supabase/functions/_shared/email.ts)
- [x] **SEC-05**: Add validacao UUID no webhook user_id - validar externalReference com regex UUID antes de usar como user_id (supabase/functions/asaas-webhook/index.ts)
- [x] **SEC-06**: Fix asaas-checkout status check - exigir status 'completed' ou checkout confirmado por ambas as partes (supabase/functions/asaas-checkout/index.ts)
- [x] **SEC-07**: Fix escrow auto-release silent failure - auto-criar wallet no trigger quando worker nao tem (supabase/migrations/20260315100000_auto_create_worker_wallet_trigger.sql)
- [x] **SEC-08**: Add max iteration limit no asaas-sync loop - limite de 50 paginas com warning no log (supabase/functions/asaas-sync/index.ts)
- [x] **SEC-09**: Add validacao checksum CPF/CNPJ - rejeitar documentos com digitos repetidos e verificar digitos verificadores (supabase/functions/asaas-deposit/index.ts)

## Phase 2: AUTH-* (Autenticacao e Controle de Acesso)

- [ ] **AUTH-06**: Centralizar admin email whitelist em env var ADMIN_EMAILS - frontend e backend com listas duplicadas (frontend/src/pages/Admin.tsx line 8, supabase/functions/admin-data/index.ts line 5)
- [ ] **AUTH-07**: Add frontend rate limiting visual no forgot password - debounce + disable botao apos envio (frontend/src/pages/ForgotPassword.tsx)
- [ ] **AUTH-08**: Fortalecer requisitos de senha - minimo 8 chars com indicador de forca (frontend/src/pages/ResetPassword.tsx, Login.tsx registro)
- [ ] **AUTH-09**: Add mensagem explicativa no redirect de ProtectedRoute - usuario nao sabe porque foi redirecionado (frontend/src/components/ProtectedRoute.tsx)

## Phase 3: FORM-* (Validacao de Formularios)

- [ ] **FORM-01**: Melhorar validacao de email em ForgotPassword - usar regex ao inves de includes('@') (frontend/src/pages/ForgotPassword.tsx line 17)
- [ ] **FORM-02**: Add validacao checksum CNPJ no CompanyOnboarding - apenas valida tamanho (frontend/src/pages/company/CompanyOnboarding.tsx)
- [ ] **FORM-03**: Melhorar validacao PIX key - validar formatos CPF/CNPJ/email/phone/chave aleatoria (frontend/src/pages/Wallet.tsx lines 92-109)
- [ ] **FORM-04**: Add confirmation dialogs para acoes destrutivas - withdrawal, job deletion, application cancel, checkout (Wallet.tsx, CompanyJobs.tsx, MyJobs.tsx)
- [ ] **FORM-05**: Fix CompanyOnboarding step 2 validation - canProceed() retorna true sempre (frontend/src/pages/company/CompanyOnboarding.tsx line 78-84)

## Phase 4: UX-* (Error Handling e Experiencia)

- [ ] **UX-05**: Add error states em CompanyDashboard - se queries falham, pagina quebra (frontend/src/pages/company/CompanyDashboard.tsx)
- [ ] **UX-06**: Melhorar loading states com skeletons ao inves de spinners genericos (MainLayout, CompanyLayout, Dashboard)
- [ ] **UX-07**: Melhorar mensagens de erro - trocar genericas por especificas em Login, ResetPassword, ForgotPassword
- [ ] **UX-08**: Add unsaved changes warning em Profile e CompanyProfile edit mode (frontend/src/pages/Profile.tsx, CompanyProfile.tsx)
- [ ] **UX-09**: Fix disabled buttons sem explicacao - add tooltip ou texto explicando porque esta desabilitado (Wallet.tsx, CompanyJobCandidates.tsx)
- [ ] **UX-10**: Add success feedback apos acoes criticas - withdrawal, deposit, profile update, job creation (toast notifications)

## Phase 5: TS-* (TypeScript e Qualidade de Codigo)

- [ ] **TS-01**: Remover todos os tipos `any` - Jobs.tsx line 13, Profile.tsx line 17, e outros
- [ ] **TS-02**: Fix ESLint react-hooks/exhaustive-deps warnings restantes (10 warnings)
- [ ] **TS-03**: Fix N+1 query em CompanyJobs.tsx - batch fetch candidate counts (lines 48-56)
- [ ] **TS-04**: Add debouncing em search inputs - Jobs.tsx, CompanyJobs.tsx
- [ ] **TS-05**: Fix MainLayout onboarding route hardcoded errado (frontend/src/layouts/MainLayout.tsx line 38)
- [ ] **TS-06**: Remover console.log/console.error desnecessarios em producao - usar Sentry exclusivamente

## Phase 6: A11Y-* (Acessibilidade)

- [ ] **A11Y-01**: Add ARIA labels em todos os form inputs - Login, Register, Onboarding, Profile, CreateJob
- [ ] **A11Y-02**: Add texto junto com indicadores de cor - status badges precisam de texto alem de cor
- [ ] **A11Y-03**: Add focus management em modais - DepositModal, RateModal, confirmacao dialogs
- [ ] **A11Y-04**: Add keyboard navigation - garantir tab order correto em todas as paginas

## Phase 7: TEST-* (Testes Abrangentes)

- [ ] **TEST-01**: Add testes para paginas de auth - Login, ForgotPassword, ResetPassword (render, validation, submit)
- [ ] **TEST-02**: Add testes para ProtectedRoute - redirect, loading, authenticated states
- [ ] **TEST-03**: Add testes para fluxos financeiros - deposit modal, withdrawal form, escrow display
- [ ] **TEST-04**: Add testes para validacao de formularios - CPF, CNPJ, PIX, email, password strength
- [ ] **TEST-05**: Add testes para componentes criticos - JobCard, NotificationBell, BottomNav, Sidebar
- [ ] **TEST-06**: Final build + lint validation limpo - zero errors, zero warnings

## Notes
- NAO alterar logica de pagamento Asaas (apenas validacao, seguranca, UX)
- Commits em portugues, sem Co-Authored-By
- Push cada commit imediatamente
- Build DEVE passar apos cada mudanca
- Uma task por iteracao do Ralph
- Prioridade: SEC > AUTH > FORM > UX > TS > A11Y > TEST
