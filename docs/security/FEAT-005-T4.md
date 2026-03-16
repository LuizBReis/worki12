# Security Audit: FEAT-005-T4

**Date:** 2026-03-13
**Feature:** WorkerOnboarding — TOS Checkbox on Final Step
**PR:** #89
**Auditor:** security-auditor agent
**Threat Model:** This task adds a TOS checkbox to `WorkerOnboarding.tsx` that: (1) blocks the "Concluir" button unless `tosAccepted === true`, and (2) includes `accepted_tos: true, tos_version: 'v1', tos_accepted_at: new Date().toISOString()` in the DB UPDATE call during onboarding completion. Threat: can a user submit onboarding without TOS acceptance? Can values be manipulated?

---

## OWASP Results

| Check | Status | Details |
|-------|--------|---------|
| A01 Access Control | PASS | `WorkerOnboarding.tsx` has existing auth check pattern (fetches `userId` via `supabase.auth.getUser()` on mount). The DB UPDATE at onboarding completion uses the `userId` from session — enforced by RLS `WITH CHECK (id = auth.uid())`. A user cannot set `accepted_tos = true` for another user. |
| A02 Cryptographic Failures | PASS | No secrets in changed files. |
| A03 Injection | PASS | `tos_version: 'v1'` is hard-coded. `tos_accepted_at: new Date().toISOString()` uses client-side time — acceptable for TOS acceptance timestamps (exact server-side time is not required for legal purposes). No user input flows into these fields beyond the checkbox state. |
| A04 Insecure Design | WARNING | Same as FEAT-005-T2: the `canProceed()` gate at `WorkerOnboarding.tsx:110` (`case 3: return formData.availability.length > 0 && tosAccepted`) is a frontend-only check. A user who bypasses the UI (e.g., API call) could complete onboarding without setting `tosAccepted = true` in React state. However, the actual DB write always includes `accepted_tos: true` — the checkbox only controls UI button state, not the value written to DB. This means: (a) users cannot set `accepted_tos: false` via this onboarding flow (value is always `true`), (b) users can potentially complete onboarding by calling the Supabase API directly and including `accepted_tos: true` without checking the checkbox. Same server-side enforcement recommendation as T2 applies. |
| A05 Misconfiguration | PASS | No edge functions, no CORS, no new routes. |
| A07 Authentication | PASS | Route is inside `<ProtectedRoute>`. Auth check on mount. |
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
| 1 | WARNING | A04 | TOS checkbox is frontend-only enforcement | `WorkerOnboarding.tsx:110` | User bypasses UI and calls Supabase directly to complete onboarding. `accepted_tos: true` is always written regardless of checkbox state — the checkbox only blocks the UI button. | Same recommendation as FEAT-005-T2: add server-side enforcement via DB trigger or RLS to require `accepted_tos = true` before allowing access to core features. |

---

## VERDICT: SHIP

No critical or high severity vulnerabilities. Same risk profile as FEAT-005-T2. Feature approved for production.
