# Security Audit: FEAT-004-T3

**Date:** 2026-03-13
**Feature:** CompanyMessages.tsx — Typing Indicator (same pattern as T2)
**PR:** #84
**Auditor:** security-auditor agent
**Threat Model:** Identical pattern to FEAT-004-T2 applied to `CompanyMessages.tsx`. Same Supabase Presence typing indicator implementation with same channel naming convention. Same threats apply.

---

## OWASP Results

| Check | Status | Details |
|-------|--------|---------|
| A01 Access Control | WARNING | `CompanyMessages.tsx:264` — Same as T2. Channel `typing:{selectedConversation.id}` is subscribable by any authenticated user who knows the conversation UUID. See FEAT-004-T2 for full analysis. |
| A02 Cryptographic Failures | PASS | No secrets in changed files. |
| A03 Injection | WARNING | `CompanyMessages.tsx:271` — Same presence spoofing issue as T2. `pTyped.userId` from presence state is client-controlled. |
| A04 Insecure Design | PASS | No financial operations. Typing indicator is UI-only. |
| A05 Misconfiguration | PASS | No edge functions, no CORS changes. Route already protected. |
| A07 Authentication | PASS | `CompanyMessages.tsx` has auth check on mount (existing pattern). Route is inside `<CompanyLayout>` behind `<ProtectedRoute>`. |
| A09 Logging | PASS | No sensitive data logged. |

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
| 1 | WARNING | A01 | Supabase Presence channels not RLS-protected (same as T2) | `CompanyMessages.tsx:264` | Same as FEAT-004-T2 finding #1 | Same remediation as T2 |
| 2 | WARNING | A03 | Presence `userId` client-controlled and spoofable (same as T2) | `CompanyMessages.tsx:271` | Same as FEAT-004-T2 finding #2 | Same remediation as T2 |

---

## VERDICT: SHIP

Identical risk profile to FEAT-004-T2. No critical or high severity vulnerabilities. Both warnings are platform-level constraints with zero financial or data-breach impact. Feature approved for production.
