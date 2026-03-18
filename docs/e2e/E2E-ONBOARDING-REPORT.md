# E2E Onboarding Report - 2026-03-18

## Summary
- **Total flows tested:** 8 (4 worker + 4 company)
- **Bugs found:** 3
- **Bugs fixed:** 3
- **All flows passing:** YES

---

## FLOW A: Worker

### A1: Worker First Login
- **Result:** PASS
- **URL flow:** `/login?type=work` -> login -> `/dashboard` -> redirect -> `/worker/onboarding`
- **Console errors:** None
- **Notes:** Login.tsx navigates to `/dashboard`, ProtectedRoute detects `onboarding_completed: false` and redirects to `/worker/onboarding`.

### A2: Worker Onboarding (3 steps)
- **Result:** PASS (after bug fixes)
- **Steps completed:**
  - Step 1: Nome, CPF, Data Nascimento, Celular, Cidade
  - Step 2: Roles (Garcom, Barman), Experiencia (1-2 anos), Bio
  - Step 3: Goal (Renda Extra), Availability (Manha, Tarde), TOS checkbox
  - Click Finalizar -> dashboard
- **Database verification:**
  - `onboarding_completed: true`
  - `accepted_tos: true`
  - `tos_version: v1`
  - Wallet created: balance R$ 0.00

### A3: Worker Second Login
- **Result:** PASS
- **URL:** Directly to `/dashboard` (no onboarding)
- **Console errors:** None

### A4: Worker Third Login
- **Result:** PASS
- **URL:** Directly to `/dashboard`
- **Navigation verified:** Clicked "BUSCAR VAGAS" -> `/jobs` loaded correctly

---

## FLOW B: Company

### B1: Company First Login
- **Result:** PASS
- **URL flow:** `/login?type=hire` -> login -> `/company/dashboard` -> redirect -> `/company/onboarding`
- **Console errors:** None

### B2: Company Onboarding (2 steps)
- **Result:** PASS (after bug fixes)
- **Steps completed:**
  - Step 1: Nome da Empresa, CNPJ, Tipo (LTDA), Setor, Cidade
  - Step 2: Hiring Goal (Freelancers Pontuais), Volume (1-5), TOS checkbox
  - Click Finalizar -> `/company/dashboard`
- **Database verification:**
  - `onboarding_completed: true`
  - `accepted_tos: true`
  - `owner_id: set correctly`
  - Wallet created: balance R$ 0.00

### B3: Company Second Login
- **Result:** PASS
- **URL:** Directly to `/company/dashboard` (no onboarding)
- **Console errors:** None

### B4: Company Third Login
- **Result:** PASS
- **URL:** Directly to `/company/dashboard`

---

## Bugs Found & Fixed

### BUG 1: ProtectedRoute blocks onboarding page from rendering
- **Symptom:** After login redirects to `/worker/onboarding`, the page shows a permanent loading spinner. The onboarding form never renders.
- **Root cause:** `ProtectedRoute.tsx` line 138 (`if (onboardingRedirect) return <Navigate to={onboardingRedirect} replace />`) fires even when the user is ALREADY on the onboarding page. The `<Navigate>` replaces the `<Outlet>` that would render the onboarding component.
- **Fix:** Added pathname check: `if (onboardingRedirect && location.pathname !== onboardingRedirect)`.
- **File:** `frontend/src/components/ProtectedRoute.tsx` line 138

### BUG 2: Onboarding completion redirects back to onboarding (infinite loop)
- **Symptom:** After completing onboarding and clicking Finalizar, `navigate('/dashboard')` is called, but ProtectedRoute's `onboardingRedirect` state is still set from the initial check. This causes an immediate redirect back to the onboarding page.
- **Root cause:** ProtectedRoute's `onboardingRedirect` is set once during initial auth check (useEffect with `[]` dependency) and never cleared. When `navigate()` changes the path, ProtectedRoute re-renders and sees `onboardingRedirect` is still set, so it redirects before any async re-check can clear it.
- **Fix:** Changed both `WorkerOnboarding.tsx` and `CompanyOnboarding.tsx` to use `window.location.href` instead of `navigate()` after completing onboarding. This forces a full page reload that re-initializes ProtectedRoute from scratch, reading the updated `onboarding_completed: true` from the database.
- **Files:**
  - `frontend/src/pages/worker/WorkerOnboarding.tsx` line 156: `navigate('/dashboard')` -> `window.location.href = '/dashboard'`
  - `frontend/src/pages/company/CompanyOnboarding.tsx` line 134: `navigate('/company/dashboard')` -> `window.location.href = '/company/dashboard'`

### BUG 3: Company onboarding upsert fails with RLS violation (403)
- **Symptom:** Company onboarding form submits correctly but the upsert to `companies` table fails with error `42501: new row violates row-level security policy`.
- **Root cause:** Migration `20260317160000_fix_companies_rls_owner_select.sql` changed the RLS policies to use `owner_id = auth.uid()` instead of `id = auth.uid()`. But the company record auto-created by the signup trigger has `owner_id: NULL`. The CompanyOnboarding upsert didn't include `owner_id`, so the RLS INSERT/UPDATE policies with `owner_id = auth.uid()` failed.
- **Fix:**
  1. Added `owner_id: userId` to the company upsert in `CompanyOnboarding.tsx`
  2. Created migration `20260318000000_fix_force_rls_service_role.sql` that:
     - Removes FORCE ROW LEVEL SECURITY (was blocking service_role)
     - Grants ALL to service_role on affected tables
     - Adds fallback RLS policies using `id = auth.uid()` for companies
- **Files:**
  - `frontend/src/pages/company/CompanyOnboarding.tsx` line 115: added `owner_id: userId`
  - `supabase/migrations/20260318000000_fix_force_rls_service_role.sql` (new)

---

## Additional Issue: FORCE RLS blocking service_role
- **Symptom:** `REVOKE ALL ON workers FROM anon` in migration `20260317150000` also revoked permissions from other roles (including postgres/service_role). Combined with `FORCE ROW LEVEL SECURITY`, this prevented service_role from accessing workers/companies/jobs/applications tables via the REST API.
- **Fix:** Migration `20260318000000_fix_force_rls_service_role.sql` removes FORCE RLS and grants ALL to service_role.

---

## Non-blocking Issues
- **406 from wallets `.single()`:** When creating a wallet during onboarding, `WalletService.getOrCreateWallet()` queries with `.single()` which returns 406 when no rows exist. This is expected behavior and handled gracefully (the code then creates a new wallet). The 406 appears in the browser console but doesn't affect the flow.

---

## Files Modified
| File | Change |
|------|--------|
| `frontend/src/components/ProtectedRoute.tsx` | Fixed onboarding redirect logic (pathname check) |
| `frontend/src/pages/worker/WorkerOnboarding.tsx` | Use `window.location.href` for post-onboarding navigation |
| `frontend/src/pages/company/CompanyOnboarding.tsx` | Added `owner_id`, use `window.location.href` for post-onboarding navigation |
| `supabase/migrations/20260318000000_fix_force_rls_service_role.sql` | Fix FORCE RLS, grant service_role, add fallback RLS policies |

## Test Files Created
| File | Purpose |
|------|---------|
| `frontend/e2e/a2-worker-onboarding.spec.ts` | Worker onboarding 3-step flow |
| `frontend/e2e/a3-worker-relogin.spec.ts` | Worker 2nd/3rd login (skip onboarding) |
| `frontend/e2e/b1-company-login.spec.ts` | Company first login |
| `frontend/e2e/b2-company-onboarding.spec.ts` | Company onboarding 2-step flow |
| `frontend/e2e/b3-company-relogin.spec.ts` | Company 2nd/3rd login (skip onboarding) |
