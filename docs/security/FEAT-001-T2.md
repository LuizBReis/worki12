# Security Audit: FEAT-001-T2

**Date:** 2026-03-15
**Feature:** Separar escrow release de avaliacao em CompanyJobCandidates
**PR:** #75
**Auditor:** security-auditor agent
**Threat Model:** This feature modifies the financial escrow release flow. It separates delivery confirmation (which triggers escrow release) from the review submission. The `handleConfirmDelivery` function calls `WalletService.releaseEscrow()` which invokes the `asaas-checkout` edge function. Attack surface: a company user could trigger escrow release. Data accessed: `escrow_transactions`, `applications`, `wallets` tables.

---

## OWASP Results

| Check | Status | Details |
|-------|--------|---------|
| A01 Access Control | PASS | `CompanyJobCandidates.tsx` is rendered inside `ProtectedRoute` (verified in `ProtectedRoute.tsx:93` — redirects to `/` if no user). The `fetchCandidates()` function at line 84 calls `supabase.auth.getUser()` and uses `user.id` to scope data. `escrow_transactions` are fetched filtered by `job_id` (RLS protects cross-company access). `releaseEscrow()` calls `invokeFunction('asaas-checkout')` which is an edge function that validates JWT server-side. The `handleConfirmDelivery` does NOT allow arbitrary worker/job — it operates on the `app` object from the fetched candidates list, which is already scoped by the authenticated company. |
| A02 Cryptographic Failures | PASS | `frontend/src/lib/supabase.ts` uses only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (env vars, not hardcoded). No `service_role` key in any frontend file. No hardcoded secrets in diff. |
| A03 Injection | PASS | All DB queries use Supabase's parameterized client (`.eq()`, `.from()`, `.select()`). No raw SQL, no `dangerouslySetInnerHTML`, no `eval()`. |
| A04 Insecure Design | PASS | Escrow release is delegated to `WalletService.releaseEscrow()` at `walletService.ts:146` which calls `invokeFunction('asaas-checkout')` — server-side edge function handles amount validation. Client does NOT send amount — the edge function calculates it server-side from the escrow record. The company balance check at line 367-372 is a UX guard only (server validates via RPC). The "Confirmar Entrega" button only appears when both checkin and checkout are confirmed (`app.company_checkin_confirmed_at && app.company_checkout_confirmed_at`), preventing premature release. |
| A05 Misconfiguration | PASS | No edge functions created/modified in this PR. CORS not applicable. Logger replaced `console.error` with `logError()` — no sensitive data in log calls (only error context strings like 'CompanyJobCandidates'). |
| A07 Authentication | PASS | Component is inside `ProtectedRoute`. `supabase.auth.getUser()` called at mount in `fetchCandidates()`. No custom session storage. |
| A09 Logging | PASS | All `console.error` calls replaced with `logError(error, 'CompanyJobCandidates')`. No passwords/tokens/amounts logged. Error context is generic string only. |

---

## Dependency Audit

`npm audit`: 0 critical, 4 high (rollup path traversal, undici issues — pre-existing, not introduced by this PR), 1 moderate

---

## Secrets Scan

No secrets found in changed files. Verified: `frontend/src/lib/supabase.ts` uses only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (env vars). `walletService.ts` calls `invokeFunction()` which uses the Supabase client with user JWT — no server keys exposed.

---

## Migration Risk Assessment

No SQL migrations in this PR. N/A.

---

## Findings

Nenhuma vulnerabilidade encontrada.

---

## VERDICT: SHIP

Nenhuma vulnerabilidade critica ou alta encontrada. Feature aprovada para producao.
