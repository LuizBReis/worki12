# Security Audit: FEAT-002-T3

**Date:** 2026-03-15
**Feature:** Exibir contador de workers em andamento em CompanyJobDetails
**PR:** #72
**Auditor:** security-auditor agent
**Threat Model:** Adds a count query for active workers (hired/in_progress) on a job. The query uses `supabase.from('applications').select('id', { count: 'exact', head: true }).eq('job_id', id).in('status', ['hired', 'in_progress'])`. RLS on `applications` table controls visibility. Also introduces `logError` from `logger.ts` (which includes Sentry integration) and `.claude/move-stage.sh` (build tooling).

---

## OWASP Results

| Check | Status | Details |
|-------|--------|---------|
| A01 Access Control | PASS | `CompanyJobDetails.tsx` is inside `ProtectedRoute`. The `fetchJobDetails()` function calls `supabase.auth.getUser()` and queries `jobs` table with `.eq('company_id', user.id)` — company can only see their own jobs. The new `fetchActiveWorkers` useEffect at line 43-56 queries applications by `job_id` — RLS on `applications` table ensures the company can only count applications for their own jobs. No IDOR — `id` comes from `useParams()` but RLS enforces ownership. |
| A02 Cryptographic Failures | PASS | No secrets in diff. `logger.ts` created uses `import * as Sentry from '@sentry/react'` — no keys exposed. |
| A03 Injection | PASS | All queries parameterized via Supabase client. No raw SQL. |
| A04 Insecure Design | PASS | Count query is read-only. Navigation to candidates page is UI-only. No financial operations. |
| A05 Misconfiguration | PASS | No edge functions. `logger.ts` conditionally sends to Sentry — no sensitive data in error messages. `.claude/move-stage.sh` is build tooling, not deployed code. |
| A07 Authentication | PASS | Protected by `ProtectedRoute`. Auth check in `fetchJobDetails`. |
| A09 Logging | PASS | `logError('Error fetching active workers', error)` — context string only, no sensitive data. |

---

## Dependency Audit

`npm audit`: 0 critical, 4 high (pre-existing)

---

## Secrets Scan

No secrets found. `.claude/move-stage.sh` contains GitHub Project field IDs (not secrets — these are public identifiers for board columns).

---

## Migration Risk Assessment

No SQL migrations. N/A.

---

## Findings

Nenhuma vulnerabilidade encontrada.

---

## VERDICT: SHIP

Nenhuma vulnerabilidade critica ou alta encontrada. Feature aprovada para producao.
