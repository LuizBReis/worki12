# Worki - Production Readiness Plan (Full Audit)

## Phase 1: SEC-* (Seguranca Critica - MUST FIX)

- [x] **SEC-01**: Fix admin-data JWT (811ab30)
- [x] **SEC-02**: Fix wallet update RLS policy (26db812)
- [x] **SEC-03**: Fix withdrawal rollback critico (d91d807)
- [x] **SEC-04**: Add HTML escaping em email templates (322a54d)
- [x] **SEC-05**: Add validacao UUID no webhook user_id (a8baf41)
- [x] **SEC-06**: Fix asaas-checkout status check (3c68d28)
- [x] **SEC-07**: Fix escrow auto-release silent failure (722fe1b)
- [x] **SEC-08**: Add max iteration limit no asaas-sync loop (a233420)
- [x] **SEC-09**: Add validacao checksum CPF/CNPJ (97fc436)

## Phase 2: AUTH-* (Autenticacao e Controle de Acesso)

- [x] **AUTH-06**: Centralizar admin email whitelist (322f0f1)
- [x] **AUTH-07**: Add rate limiting visual no forgot password (ba762b2)
- [x] **AUTH-08**: Fortalecer requisitos de senha (f4d49ee + e38a35f)
- [x] **AUTH-09**: Add mensagem no redirect de ProtectedRoute (55b6d27)

## Phase 3: FORM-* (Validacao de Formularios)

- [x] **FORM-01**: Melhorar validacao de email em ForgotPassword (incluido em ba762b2)
- [x] **FORM-02**: Add validacao checksum CNPJ no CompanyOnboarding (67a08de)
- [x] **FORM-03**: Melhorar validacao PIX key (e94fa73)
- [x] **FORM-04**: Add confirmation dialogs para acoes destrutivas (d34a3ac)
- [x] **FORM-05**: Fix CompanyOnboarding step 2 validation - canProceed() retorna true sempre (frontend/src/pages/company/CompanyOnboarding.tsx line 78-84)

## Phase 4: UX-* (Error Handling e Experiencia)

- [x] **UX-05**: Add error states em CompanyDashboard (00b4b0e)
- [x] **UX-06**: Loading skeletons (d01846a)
- [x] **UX-07**: Melhorar mensagens de erro - trocar genericas por especificas em Login, ResetPassword, ForgotPassword (ja implementado)
- [x] **UX-08**: Add unsaved changes warning em Profile e CompanyProfile edit mode (ja implementado)
- [x] **UX-09**: Fix disabled buttons sem explicacao (ja implementado)
- [x] **UX-10**: Add success feedback apos acoes criticas (ja implementado)

## Phase 5: TS-* (TypeScript e Qualidade de Codigo)

- [x] **TS-01**: Remover todos os tipos `any` - Jobs.tsx any[] substituido por JobWithCompany[] (06eec20)
- [x] **TS-02**: Fix ESLint exhaustive-deps - justificativa adicionada em 7 eslint-disable (910c9f1)
- [x] **TS-03**: Fix N+1 query em CompanyJobs.tsx - batch fetch com .in() (ja implementado)
- [x] **TS-04**: Add debouncing 300ms em search inputs - Jobs.tsx, CompanyJobs.tsx (aa98731)
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
