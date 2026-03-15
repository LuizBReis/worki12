# Security Audit: FEAT-005-T1

**Date:** 2026-03-13
**Feature:** Migration SQL — Add TOS Acceptance Columns to workers and companies
**PR:** #86
**Auditor:** security-auditor agent
**Threat Model:** This migration adds `accepted_tos` (BOOLEAN), `tos_version` (TEXT), and `tos_accepted_at` (TIMESTAMPTZ) columns to `workers` and `companies` tables. The migration comment states that existing RLS policies already allow workers/companies to update their own profiles. Threat model: (1) can a user set `accepted_tos = true` for another user? (2) can a user set `tos_version` to an arbitrary value? (3) rollback script present?

---

## OWASP Results

| Check | Status | Details |
|-------|--------|---------|
| A01 Access Control | PASS | The migration comment correctly identifies that existing RLS policies enforce `id = auth.uid()` for UPDATE operations on `workers` and `companies` (see `20260309000000_enable_rls_all_tables.sql` — "Workers can update their own profile" and "Companies can update their own profile"). User A cannot set `accepted_tos = true` on User B's row because the RLS WITH CHECK clause enforces `id = auth.uid()`. |
| A02 Cryptographic Failures | PASS | No secrets in migration file. |
| A03 Injection | PASS | Schema-only migration with `ALTER TABLE` statements. No dynamic SQL, no user input. |
| A04 Insecure Design | WARNING | (1) The `tos_version` field is a free TEXT field — a user could theoretically set it to any value via the existing UPDATE policy. However, since the UI always sends 'v1' and users cannot submit arbitrary versions that affect application behavior, this is a low-risk design choice. (2) No `-- DOWN (rollback):` script. This migration is LOW risk (adding nullable/default columns). Rollback would be: `ALTER TABLE workers DROP COLUMN IF EXISTS accepted_tos, DROP COLUMN IF EXISTS tos_version, DROP COLUMN IF EXISTS tos_accepted_at; ALTER TABLE companies DROP COLUMN IF EXISTS accepted_tos, DROP COLUMN IF EXISTS tos_version, DROP COLUMN IF EXISTS tos_accepted_at;` |
| A05 Misconfiguration | PASS | No RLS changes needed for new columns — existing policies cover the table-level UPDATE access. |
| A07 Authentication | PASS | DB migration only. No frontend auth changes. |
| A09 Logging | PASS | No logging in migration. |

---

## Migration Risk Classification

**Risk:** LOW (additive schema change — new columns with defaults, no trigger functions)

**Down script present:** NO — acceptable for LOW-risk migrations. Rollback is straightforward: drop the three columns.

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
| 1 | WARNING | A04 | `tos_version` is a free TEXT field writable by authenticated users | `20260312100000_add_tos_acceptance.sql:7` | An authenticated user could UPDATE their own `tos_version` to any arbitrary string (e.g., 'v999'). This has no impact if the application only checks `accepted_tos = true` boolean, but could create data integrity issues if future logic gates on specific version values. | Add a CHECK constraint: `tos_version TEXT CHECK (tos_version IN ('v1', 'v2', 'v3'))` or validate in the application layer before writing. |

---

## VERDICT: SHIP

No critical or high severity vulnerabilities. The WARNING about `tos_version` is a data-integrity concern, not an exploitable security vulnerability in the current application behavior. Feature approved for production.
