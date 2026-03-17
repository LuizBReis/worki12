# MVP Readiness Audit — Worki

**Date:** 2026-03-16
**Auditor:** MVP Readiness Auditor Agent (opus)
**Commit:** 98ef5936f039edcd165941d67e07e8a636a88a00
**Branch:** main

---

## Executive Summary

**Overall Readiness:** Launch with Caveats

Worki is in strong shape for MVP launch. The core payment pipeline (deposit, escrow, release, withdraw) is well-implemented with atomic RPCs, rate limiting, and proper rollback handling. Auth flows are complete, RLS is enabled on all primary tables, and the UI is polished with neo-brutalist consistency. The codebase has 160+ passing tests, Sentry error monitoring, lazy loading, and CI/CD via GitHub Actions.

However, there are gaps that need attention before real money flows: the `Message` table lacks RLS policies (data leak risk), 4 test files are failing (8 tests), there are 39+ instances of `console.error` in production code instead of `logError`, the `send-notification` edge function has no auth check, and some legacy edge functions (`jobs-api`, `profiles-api`, `applications-api`) reference Prisma-era table schemas that may not exist in the current database.

**By the numbers:**
- P0 (Blockers): 2 issues
- P1 (Critical): 5 issues
- P2 (Important): 6 issues
- P3 (Nice-to-have): 4 issues
- Total effort estimate: 52h

---

## Feature Map

### Worker Journey
| Step | Screen | Route | Status | Notes |
|------|--------|-------|--------|-------|
| 1 | Landing/Onboarding | / | OK | HomeRedirect dispatches to correct role dashboard |
| 2 | Sign Up | /login?type=work | OK | Email+password, password strength meter, Supabase Auth |
| 3 | Worker Onboarding | /worker/onboarding | OK | Multi-step, creates worker profile, sets onboarding_completed |
| 4 | Dashboard | /dashboard | OK | React Query, next job, history, recommended jobs |
| 5 | Browse Jobs | /jobs | OK | Advanced filters (category, budget, city, modality), search params |
| 6 | My Jobs | /my-jobs | OK | Applied/In Progress/Completed tabs, check-in/out, cancel |
| 7 | Wallet | /wallet | OK | Balance, withdraw via PIX, transaction history, sync |
| 8 | Profile | /profile | OK | Edit profile, change password, delete account (LGPD) |
| 9 | Messages | /messages | OK | Real-time via Supabase, typing indicator |
| 10 | Notifications | /notifications | OK | Filter by type, mark as read, paginated |
| 11 | Password Reset | /esqueci-senha, /redefinir-senha | OK | Full flow implemented |

### Company Journey
| Step | Screen | Route | Status | Notes |
|------|--------|-------|--------|-------|
| 1 | Sign Up | /login?type=hire | OK | Email+password, Supabase Auth |
| 2 | Company Onboarding | /company/onboarding | OK | Multi-step with TOS checkbox |
| 3 | Dashboard | /company/dashboard | OK | React Query, stats, recent activity |
| 4 | Create Job | /company/create | OK | 3-step wizard, balance check, escrow reserve on create |
| 5 | My Jobs | /company/jobs | OK | List with status filters |
| 6 | Job Details | /company/jobs/:id | OK | View details, edit link |
| 7 | Candidates | /company/jobs/:id/candidates | OK | Lifecycle stepper, confirm delivery, rate worker |
| 8 | Worker Profile | /company/worker/:id | OK | Public profile with reviews |
| 9 | Wallet | /company/wallet | OK | Balance, deposit via PIX, escrow overview |
| 10 | Profile | /company/profile | OK | Edit, change password, delete account |
| 11 | Messages | /company/messages | OK | Real-time messaging |
| 12 | Analytics | /company/analytics | OK | Views, candidates stats |
| 13 | Notifications | /company/notifications | OK | Same component as worker |

### Admin
| Screen | Route | Status | Notes |
|--------|-------|--------|-------|
| Admin Panel | /admin | OK | Own auth (email whitelist), stats, users, escrows, manual credit |

### Public
| Screen | Route | Status | Notes |
|--------|-------|--------|-------|
| Terms of Service | /termos | OK | |
| Privacy Policy | /privacidade | OK | |
| Help | /ajuda | OK | |
| Forgot Password | /esqueci-senha | OK | |
| Reset Password | /redefinir-senha | OK | |
| 404 Not Found | * | OK | Catch-all route |

---

## Audit Results

### 1. Core Features 8/10

**Excellent:**
- Complete worker and company journeys from signup to payment
- Job creation with escrow reserve is atomic — if escrow fails, job is rolled back (`CompanyCreateJob.tsx:192-197`)
- Wallet sync with Asaas on page load ensures balance accuracy (`Wallet.tsx:62-74`)
- Withdraw flow with 5% fee, PIX key validation (CPF/CNPJ/email/phone/EVP), and confirmation dialog
- Escrow release separated from review — company can release payment before rating (`CompanyJobCandidates.tsx:127-147`)
- Job lifecycle stepper provides clear visual progress (`JobLifecycleStepper.tsx`)

**Gaps:**
- **AUDIT-01 (P1):** Legacy edge functions `jobs-api`, `profiles-api`, and `applications-api` reference Prisma-era tables (`Job`, `ClientProfile`, `FreelancerProfile`, `JobApplication`, `Conversation` with `applicationId`) that may not match the current schema (`jobs`, `companies`, `workers`, `applications`). These functions appear unused by the current frontend (frontend uses direct Supabase client calls), but they're deployed and could cause confusion or be mistakenly called. They should be removed or explicitly deprecated.
- **AUDIT-02 (P2):** The `send-notification` function is called internally but emails use hardcoded `worki.com.br` links in templates (`email.ts:72,91,108,127`). If the production domain differs, all email CTAs will be broken. Domain should come from env var.

### 2. Auth & Authorization 8/10

**Excellent:**
- `ProtectedRoute` wraps all authenticated routes (`App.tsx:131-166`)
- Onboarding gate forces completion before accessing main pages (`ProtectedRoute.tsx:30-73`)
- TOS acceptance gate with non-closable modal (`ProtectedRoute.tsx:75-110`)
- Session persistence via `onAuthStateChange` in both `AuthContext.tsx` and `ProtectedRoute.tsx`
- Password reset flow complete: forgot password form, email link, reset page
- Sign up prompts email verification (`Login.tsx:49-51`)
- Admin page has its own email whitelist auth (`Admin.tsx:136-152`)
- Logout accessible via Sidebar in all layouts

**Gaps:**
- **AUDIT-03 (P2):** No role-based route isolation in `ProtectedRoute`. A worker who knows the URL could navigate to `/company/dashboard` or vice versa. The pages themselves fetch data by `auth.uid()` so they'd see empty state (not other users' data), but the UX is confusing. The navigation menus are role-specific, but direct URL access is not blocked.
- **AUDIT-04 (P3):** Email verification is not enforced. The signup shows a "confirm your email" message (`Login.tsx:50`) but the login does not check `email_confirmed_at`. Users with unconfirmed emails can sign in. Supabase default config may handle this, but it's not explicitly enforced in code.

### 3. Data & Database 8/10

**Excellent:**
- RLS enabled on all primary tables: wallets, escrow_transactions, wallet_transactions, notifications, workers, companies, jobs, applications, reviews, job_categories, Conversation, analytics_events (`20260309000000_enable_rls_all_tables.sql`)
- Escrow operations use atomic RPCs (`reserve_escrow`, `release_escrow`, `refund_escrow`, `credit_deposit`)
- Wallet balance has CHECK constraint preventing negative values
- Unique constraint on `(wallet_id, reference_id)` prevents duplicate deposit credits
- Worker rating auto-updated via DB trigger (`20260312200000_auto_update_worker_rating.sql`)
- TOS acceptance tracked in DB with migration (`20260312100000_add_tos_acceptance.sql`)
- Foreign key constraints on all tables (user_id references auth.users with ON DELETE CASCADE)
- Proper indexes on notification tables for performance

**Gaps:**
- **AUDIT-05 (P0):** The `Message` table has NO RLS policies. No migration enables RLS or creates policies for `Message`. Any authenticated user could potentially read any message in the system via direct Supabase client call. This is a data privacy violation.
- **AUDIT-06 (P2):** The `Conversation` table uses `application_uuid` for RLS policy checks, but the `update` policy is missing. Users cannot update Conversation records (e.g., lock/unlock) via RLS — this is handled by edge functions with service_role, but the gap means the `Conversation` table's `islocked` field can only be modified server-side.

### 4. Error Handling 6/10

**Excellent:**
- Error boundary wraps the entire app (`App.tsx:112,175`)
- Loading states on all pages (skeleton/spinner patterns throughout)
- Empty states on all lists (jobs, notifications, transactions, candidates)
- Toast notifications for all user actions (success/error feedback)
- Edge functions return proper HTTP status codes (400, 401, 403, 429, 500)
- 404 catch-all route exists (`App.tsx:167`)

**Gaps:**
- **AUDIT-07 (P1):** 39+ instances of `console.error`/`console.log`/`console.warn` in production code instead of `logError`. Files affected include: `RateModal.tsx`, `NotificationContext.tsx`, `CompanyLayout.tsx`, `CompanyAnalytics.tsx`, `CompanyCreateJob.tsx`, `CompanyJobDetails.tsx`, `CompanyJobs.tsx`, `CompanyMessages.tsx`, `CompanyOnboarding.tsx`, `CompanyProfile.tsx`, `WorkerPublicProfile.tsx`, `CreateJob.tsx`, `Jobs.tsx`, `Messages.tsx`, `MyJobs.tsx`, `Profile.tsx`, `WorkerOnboarding.tsx`, `analytics.ts`, `gamification.ts`. These errors will be invisible in production (no Sentry capture).
- **AUDIT-08 (P1):** 4 test files are failing with 8 broken tests. Failing files: `ProtectedRoute.test.tsx` (2 failed), `ProtectedRoute.onboarding.test.tsx` (3 failed), `__tests__/ProtectedRoute.test.tsx` (2 failed), `CompanyJobCandidates.test.tsx` (1 failed). The ProtectedRoute tests fail because TosGateModal needs `useToast` but tests don't wrap with `ToastProvider`. CI should block PRs with test failures.

### 5. Security 8/10

**Excellent:**
- No secrets in frontend code (only anon key, which is safe)
- No XSS vectors — no `dangerouslySetInnerHTML`, `innerHTML`, or `eval`
- All edge functions have CORS handlers (OPTIONS method)
- All financial edge functions have JWT validation (extract token, verify via `auth.getUser`)
- `asaas-webhook` validates webhook source: IP whitelist in production + webhook token header (`asaas-webhook/index.ts:1002-1046`)
- Rate limiting on deposit (5/min), withdraw (3/min), and checkout (5/min) (`rate-limit.ts`)
- Input validation: CPF/CNPJ checksum validation on deposit, amount min/max on deposit and withdraw
- Email HTML escaping prevents XSS in email templates (`email.ts:49-56`)
- CORS restricted to configured origin in production, wildcard only in sandbox (`asaas.ts:1-14`)
- `delete-account` checks for active escrows before allowing deletion (`delete-account/index.ts:1343-1371`)
- `.gitignore` properly excludes `.env`, `.env.local`, `dist/`
- No `localStorage`/`sessionStorage` usage

**Gaps:**
- **AUDIT-09 (P0):** The `send-notification` edge function has NO authentication check. It accepts any request with a `type` and `userId`, creates in-app notifications, and sends emails. While it uses `service_role` internally, any caller (not just edge functions) could invoke it to spam notifications to any user. It should validate that the caller is internal (service_role or another edge function).
- **AUDIT-10 (P2):** The `frontend/.env` file is tracked in git (`git ls-files` shows `frontend/.env`). While it only contains the Supabase anon key (which is intentionally public), committing `.env` files is a bad practice that risks accidental secret exposure in the future. It should be removed from git tracking.

### 6. Infrastructure 8/10

**Excellent:**
- Build passes with 0 errors (tested: `npm run build` succeeds in 20.67s)
- Lint passes clean (`npm run lint` — no output)
- TypeScript strict mode enabled (`tsconfig.app.json`: `"strict": true`)
- Lazy loading for all pages via `React.lazy` + `Suspense` (`App.tsx:13-48`)
- Source maps configured as `hidden` (not served to clients, available for Sentry)
- Sentry integration with user identification in `AuthContext.tsx`
- CI pipeline: GitHub Actions on PR with install, lint, build, test (`ci.yml`)
- Staging deploy workflow exists (`deploy-staging.yml`)
- `.env.example` files exist for frontend and supabase
- React Query configured with sensible defaults (5min stale, 30min gc, no refetch on window focus)
- Bundle size reasonable: main chunk 459KB / 136KB gzipped

**Gaps:**
- **AUDIT-11 (P2):** No security headers configuration. No `vercel.json`, `netlify.toml`, or `_headers` file to set Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security. These headers protect against clickjacking, MIME sniffing, and protocol downgrade attacks.

### 7. User Experience 8/10

**Excellent:**
- Onboarding flows complete for both worker and company roles
- Mobile responsive (66 responsive breakpoint classes across pages)
- Neo-brutalist design consistent: `border-2 border-black`, `shadow-[8px_8px...]`, green for workers, blue for companies
- Navigation accessible from every page (Sidebar + BottomNav)
- Favicon and meta tags configured (`index.html`: pt-BR lang, OG tags, theme-color)
- Terms of Service and Privacy Policy pages exist
- Forms prevent double-submit (disabled while loading in all forms)
- Accessibility: 66 aria-label/role attributes across components
- Destructive actions have confirmation dialogs (delete account, withdraw funds, confirm delivery)
- Dates formatted for Brazilian locale with `date-fns/locale/ptBR`
- Currency formatted as BRL throughout (R$ with comma separator)
- Password strength indicator on signup
- Session expiry handling with redirect message

**Gaps:**
- **AUDIT-12 (P3):** No `og:image` meta tag. Social media shares will show a blank preview. Adding a branded OG image would significantly improve link sharing on WhatsApp, which is critical for Brazilian market distribution.
- **AUDIT-13 (P3):** The landing page (`Onboarding.tsx`) is shown to unauthenticated users at `/` — there's no separate public marketing page. For MVP this is acceptable, but a proper landing page with SEO content would improve organic acquisition.

### 8. Testing 6/10

**Excellent:**
- Test framework: Vitest configured and integrated in CI
- 160 passing tests across 20 test files
- Coverage of key components: ErrorBoundary, EscrowStatusBadge, JobLifecycleStepper, PageMeta, ProtectedRoute, TosGateModal, BottomNav, DepositModal, JobCard, NotificationBell
- Service tests: `walletService.test.ts` covers withdraw, deposit, escrow operations
- Page tests: Jobs, Notifications, Profile, Login, ForgotPassword, ResetPassword, CompanyJobCandidates, WorkerPublicProfile
- Library tests: validation, gamification, logger
- Playwright E2E framework configured (FEAT-014)
- TypeScript strict mode catches type errors at build time

**Gaps:**
- **AUDIT-14 (P1):** 8 tests failing across 4 files. Root cause: ProtectedRoute tests don't wrap TosGateModal with ToastProvider. This means CI should be failing on test step — the tests need to be fixed or CI will block all PRs.
- **AUDIT-15 (P2):** No tests for critical pages: CompanyWallet, CompanyDashboard, CompanyOnboarding, CompanyProfile, Dashboard, Wallet, Messages, CompanyMessages, MyJobs, Admin. These contain business-critical logic (escrow, payments, messaging).
- **AUDIT-16 (P3):** No edge function tests. The Deno edge functions handle all payment operations but have zero test coverage. Financial edge functions (`asaas-checkout`, `asaas-deposit`, `asaas-withdraw`, `asaas-webhook`) are the most critical code in the entire system.

---

## Critical Path to Launch

### Phase 1: Blockers (P0) — 8h

1. **AUDIT-05:** Add RLS policies to `Message` table — prevent cross-user message reading (4h)
2. **AUDIT-09:** Add auth validation to `send-notification` edge function — prevent notification spam (4h)

### Phase 2: Critical (P1) — 18h

3. **AUDIT-01:** Audit and remove/deprecate legacy edge functions (`jobs-api`, `profiles-api`, `applications-api`) (4h)
4. **AUDIT-07:** Replace all `console.error`/`console.log` with `logError` across 20+ files (4h)
5. **AUDIT-08:** Fix 8 failing tests — add ToastProvider wrapper to ProtectedRoute test suites (3h)
6. **AUDIT-14:** Same as AUDIT-08 (consolidated)

### Phase 3: Quality (P2) — 18h

7. **AUDIT-02:** Extract email template domain to env var (2h)
8. **AUDIT-03:** Add role-based route guard in ProtectedRoute (3h)
9. **AUDIT-06:** Add Conversation update RLS policy (2h)
10. **AUDIT-10:** Remove `frontend/.env` from git tracking (1h)
11. **AUDIT-11:** Add security headers configuration (3h)
12. **AUDIT-15:** Add tests for critical pages (CompanyWallet, Dashboard, Wallet) (8h)

### Phase 4: Polish (P3) — 8h

13. **AUDIT-04:** Enforce email verification check on login (2h)
14. **AUDIT-12:** Add OG image meta tag (1h)
15. **AUDIT-13:** Create proper landing page for unauthenticated users (4h)
16. **AUDIT-16:** Add edge function integration tests for payment flows (depends on test infra)

---

## What's Working Well

1. **Payment Pipeline is Solid:** Atomic RPCs, rate limiting, rollback on failure, PIX key validation with checksum — this is production-grade financial infrastructure.
2. **Security Posture is Strong:** IP whitelisting + webhook token for Asaas, CPF/CNPJ validation, amount bounds checking, no secrets in frontend, RLS on all primary tables.
3. **Error Monitoring Ready:** Sentry integration with user identification, hidden source maps, `logError` utility for centralized error capture.
4. **Developer Experience is Good:** ESLint clean, TypeScript strict, lazy loading, React Query caching, CI pipeline, organized directory structure.
5. **UI is Polished and Consistent:** Neo-brutalist design language maintained across all pages, proper loading/empty states, toast feedback on all actions, mobile responsive.
6. **Auth Flow is Complete:** Signup, login, logout, forgot password, reset password, TOS gate, onboarding gate — all implemented.
7. **Code Quality:** Clean separation of concerns — services layer for wallet operations, contexts for auth/notifications/toast, hooks for reusable logic.
8. **LGPD Compliance:** Account deletion with data anonymization, escrow check before deletion, and auth user removal.
9. **Escrow/Lifecycle UX:** Clear stepper visualization, check-in/check-out workflow, separated delivery confirmation from review — good UX for both sides.
10. **Test Foundation:** 160+ tests with Vitest, E2E framework with Playwright ready to expand.

---

## Appendix: All Findings

| # | Priority | Category | Title | Effort | Issue |
|---|----------|----------|-------|--------|-------|
| 1 | P0 | Security/Data | Message table missing RLS policies | 4h | #116 |
| 2 | P0 | Security | send-notification edge function has no auth check | 4h | #117 |
| 3 | P1 | Core Features | Legacy edge functions reference non-existent Prisma tables | 4h | #118 |
| 4 | P1 | Error Handling | 39+ console.error instances in production code | 4h | #119 |
| 5 | P1 | Testing | 8 failing tests across 4 test files | 3h | #120 |
| 6 | P1 | Core Features | Hardcoded domain in email templates | 2h | #121 |
| 7 | P2 | Auth | No role-based route isolation in ProtectedRoute | 3h | #122 |
| 8 | P2 | Data | Conversation table missing UPDATE RLS policy | 2h | #123 |
| 9 | P2 | Security | frontend/.env tracked in git | 1h | #124 |
| 10 | P2 | Infrastructure | No security headers configuration | 3h | #125 |
| 11 | P2 | Testing | No tests for critical business pages | 8h | #126 |
| 12 | P3 | Auth | Email verification not enforced on login | 2h | #127 |
| 13 | P3 | UX | No OG image meta tag for social sharing | 1h | #128 |
| 14 | P3 | UX | No public landing page for SEO | 4h | #129 |
| 15 | P3 | Testing | No edge function integration tests | 8h | #130 |
