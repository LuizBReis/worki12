# Security Audit: FEAT-005-T5

**Date:** 2026-03-13
**Feature:** CompanyOnboarding — TOS Checkbox on Final Step
**PR:** #90
**Auditor:** security-auditor agent
**Threat Model:** Identical pattern to FEAT-005-T4 applied to `CompanyOnboarding.tsx`. Adds TOS checkbox gating final onboarding step and includes `accepted_tos: true, tos_version: 'v1', tos_accepted_at` in DB UPDATE. Same threat model applies.

---

## OWASP Results

| Check | Status | Details |
|-------|--------|---------|
| A01 Access Control | PASS | `CompanyOnboarding.tsx` has existing auth check. DB UPDATE uses session user ID. RLS enforces `WITH CHECK (id = auth.uid())` on companies table. Company A cannot set `accepted_tos = true` for Company B. |
| A02 Cryptographic Failures | PASS | No secrets in changed files. |
| A03 Injection | PASS | Hard-coded `tos_version: 'v1'`. Client-side timestamp is acceptable. No user input in TOS fields. |
| A04 Insecure Design | WARNING | Same as FEAT-005-T4: `canProceed()` at line `CompanyOnboarding.tsx:82` (`case 2: return tosAccepted`) is frontend-only. Direct API call bypasses checkbox. Same server-side enforcement recommendation applies. |
| A05 Misconfiguration | PASS | No edge functions, no CORS, no new routes. |
| A07 Authentication | PASS | Route inside `<ProtectedRoute>`. Auth check on mount. |
| A09 Logging | PASS | No sensitive data logged in changed code. |

---

## Dependency Audit

`npm audit`: 0 critical, 3 high (pre-existing), 1 moderate.

---

## Secrets Scan

No secrets found in changed files.

---

## Findings

| # | Severity | Category | Description | File:Line | Attack Scenario | Remediation |
|---|----------|----------|-------------|-----------|-----------------|-------------|
| 1 | WARNING | A04 | TOS checkbox is frontend-only enforcement | `CompanyOnboarding.tsx:82` | Same as FEAT-005-T4 | Same remediation as T4 |

---

## VERDICT: SHIP

No critical or high severity vulnerabilities. Same risk profile as FEAT-005-T4. Feature approved for production.
