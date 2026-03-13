# Security Audit: FEAT-005-T2

**Date:** 2026-03-13
**Feature:** TosGateModal — Non-closeable TOS Acceptance Modal
**PR:** #87
**Auditor:** security-auditor agent
**Threat Model:** `TosGateModal.tsx` is a blocking modal that: (1) calls `supabase.auth.getUser()` to verify session, (2) updates the user's `accepted_tos`, `tos_version`, and `tos_accepted_at` in either `workers` or `companies` table. Threat model: (1) can a user bypass the modal and mark TOS as accepted without actually clicking? (2) can a user set TOS acceptance for another user? (3) can the `userRole` prop be manipulated to write to the wrong table? (4) is the modal truly non-closeable (can JS-savvy user bypass it)?

---

## OWASP Results

| Check | Status | Details |
|-------|--------|---------|
| A01 Access Control | PASS | `TosGateModal.tsx:20` — `supabase.auth.getUser()` is called before the DB update, verifying the session. `TosGateModal.tsx:30-36` — the UPDATE uses `.eq('id', user.id)` where `user` is from `auth.getUser()` — server-side session, not user-supplied. The RLS UPDATE policy (`id = auth.uid()`) provides a second layer of enforcement: even if `user.id` were somehow manipulated client-side, the DB would reject the update for any row where `id != auth.uid()`. User A cannot set `accepted_tos = true` for User B. |
| A02 Cryptographic Failures | PASS | No secrets in changed files. No service_role key. |
| A03 Injection | PASS | `tos_version: 'v1'` and `tos_accepted_at: new Date().toISOString()` are hard-coded — no user input flows into these fields. `userRole` prop is constrained by TypeScript to `'worker' | 'company'` — no SQL injection possible via the table name selection (`table` variable). |
| A04 Insecure Design | WARNING | (1) **Frontend-only enforcement**: The modal is non-closeable in the UI (`fixed inset-0 bg-black/80 z-50` with no close button or escape handler). However, a technically sophisticated user could bypass it by: (a) calling the Supabase API directly to set `accepted_tos = true` on their own row (they have UPDATE permission on their own profile), or (b) using browser devtools to modify React state. This is inherent to any client-side gate and is acceptable if the system's trust boundary is "user must accept TOS to use the platform." (2) No server-side enforcement of TOS acceptance before processing jobs/applications/wallet operations — the gate is purely UI. If business requires hard enforcement, middleware or RLS policy should check `accepted_tos = true` before allowing other table access. |
| A05 Misconfiguration | PASS | No edge functions, no CORS. |
| A07 Authentication | PASS | `TosGateModal.tsx:20` — `supabase.auth.getUser()` called; if session expired, shows error toast and returns. |
| A09 Logging | PASS | No sensitive data logged. Toast messages are user-facing and appropriate. |

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
| 1 | WARNING | A04 | TOS gate is frontend-only; no server-side enforcement | `TosGateModal.tsx` entire file | A technically sophisticated user can bypass the UI modal by calling Supabase API directly or using devtools to set `accepted_tos = true` without reading the TOS. This defeats the legal purpose of requiring TOS acceptance. | Add a DB-level check: either an RLS policy that blocks INSERT into `applications` if `workers.accepted_tos = false`, or a trigger on `applications` INSERT that validates `accepted_tos = true` for the worker. For legal compliance, server-side enforcement is strongly recommended. |

---

## VERDICT: SHIP

No critical or high severity vulnerabilities from a data security perspective. The WARNING is a legal/compliance concern (TOS bypass) rather than a data breach or financial risk. The underlying data access is correctly protected by RLS. Feature approved for production with strong recommendation to add server-side TOS enforcement in a follow-up task.
