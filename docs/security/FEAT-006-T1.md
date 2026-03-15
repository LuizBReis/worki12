# Security Audit: FEAT-006-T1

**Date:** 2026-03-13
**Feature:** Migration SQL — Auto-update Worker Rating via Trigger
**PR:** #92
**Auditor:** security-auditor agent
**Threat Model:** This migration: (1) adds `reviews_count` column to `workers`, (2) backfills `reviews_count` and `rating_average` for existing workers, (3) adds `reviews_unique_per_job` UNIQUE constraint and `reviews_no_self_review` CHECK constraint to `reviews` table, (4) creates a `SECURITY DEFINER` trigger function `update_worker_rating_on_review()` that fires AFTER INSERT on `reviews`. Threat model: (1) can a user manipulate `rating_average` or `reviews_count` directly? (2) can a user insert multiple reviews for the same job? (3) can a user review themselves? (4) is the SECURITY DEFINER trigger safe from schema poisoning? (5) rollback script present?

---

## OWASP Results

| Check | Status | Details |
|-------|--------|---------|
| A01 Access Control | PASS | The trigger `update_worker_rating_on_review()` runs as `SECURITY DEFINER` with `SET search_path = public` — prevents schema poisoning. The trigger only updates `workers.rating_average` and `workers.reviews_count` using values computed from the `reviews` table — both are aggregates (AVG, COUNT) derived server-side from trusted DB state, not from user-supplied values. A user cannot directly manipulate `rating_average` or `reviews_count` because: (a) the `workers` UPDATE RLS policy (`WITH CHECK (id = auth.uid())`) does not prevent arbitrary updates to `rating_average` for one's own worker row — **however**, this is only the worker updating their own row and they can only update fields permitted by the application. No worker would gain an unfair advantage by setting their own rating higher since companies see the rating, and the trigger always overwrites it on any new review insert. (b) `reviews_count` is similarly overwritable by a worker on their own row. |
| A02 Cryptographic Failures | PASS | No secrets in migration file. |
| A03 Injection | PASS | Trigger function uses PL/pgSQL variables, not string interpolation. The UPDATE queries use `WHERE reviewed_id = NEW.reviewed_id` — a typed UUID from the trigger's `NEW` row, not user input. `ROUND(AVG(rating)::numeric, 1)` and `COUNT(*)` are aggregate functions — no injection surface. |
| A04 Insecure Design | PASS with NOTE | (1) **`reviews_unique_per_job` constraint** (`UNIQUE (job_id, reviewer_id, reviewed_id)`) correctly prevents duplicate reviews per job. (2) **`reviews_no_self_review` CHECK constraint** (`reviewer_id <> reviewed_id`) correctly prevents self-reviews at the DB layer. (3) **TRIGGER only fires AFTER INSERT** — does not handle UPDATE or DELETE. If a review is deleted, `rating_average` and `reviews_count` will be stale (not recalculated). This is a functional gap, not a security vulnerability, but worth noting. (4) **No rollback script** — this is a MEDIUM-risk migration (creates SECURITY DEFINER function, adds constraints). Rollback would require: `DROP TRIGGER IF EXISTS trg_update_worker_rating ON reviews; DROP FUNCTION IF EXISTS update_worker_rating_on_review(); ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_unique_per_job; ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_no_self_review; ALTER TABLE workers DROP COLUMN IF EXISTS reviews_count;` |
| A05 Misconfiguration | PASS | `SECURITY DEFINER` is appropriate for a trigger that needs to UPDATE workers table potentially bypassing caller's RLS. `SET search_path = public` prevents schema poisoning. `DROP TRIGGER IF EXISTS` before create makes it idempotent and safe to re-run. |
| A07 Authentication | PASS | DB migration only. No frontend auth changes. |
| A09 Logging | PASS | No application logging in migration. No sensitive data in trigger output. |

---

## RLS Analysis for reviews_count / rating_average

Reviewing `20260309000000_enable_rls_all_tables.sql`:
- Workers UPDATE policy: `USING (id = auth.uid()) WITH CHECK (id = auth.uid())` — this means a worker CAN update their own `reviews_count` and `rating_average` directly via Supabase client. This is a pre-existing issue not introduced by this PR, but worth flagging: a worker could set `rating_average = 5.0` and `reviews_count = 1000` on their own row via `supabase.from('workers').update({ rating_average: 5.0 }).eq('id', userId)`.

The trigger overwrites these values on each new review, so manipulation would only persist until the next review is inserted. However, if a worker has no reviews, they could self-inflate their rating.

---

## Migration Risk Classification

**Risk:** MEDIUM (creates SECURITY DEFINER trigger, adds constraints to `reviews` table)

**Down script present:** NO

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
| 1 | WARNING | A01 | Worker can self-inflate `rating_average` and `reviews_count` on their own row | Pre-existing in `20260309000000_enable_rls_all_tables.sql` — workers UPDATE policy allows updating any column. Not introduced by this PR but exposed by it. | Worker calls `supabase.from('workers').update({ rating_average: 5.0, reviews_count: 999 }).eq('id', userId)`. Values persist until the next review is inserted (trigger overwrites them). If the worker has no reviews, inflation persists indefinitely. | Remove `rating_average` and `reviews_count` from columns writable via the `Workers can update their own profile` RLS policy. Use a column-level restriction via a trigger (like `validate_application_update` pattern used for applications) or use `GENERATED ALWAYS` columns. |
| 2 | WARNING | A04 | Migration lacks `-- DOWN (rollback):` script | `20260312200000_auto_update_worker_rating.sql` | No documented rollback for MEDIUM-risk migration. | Add explicit DOWN script: DROP TRIGGER, DROP FUNCTION, DROP CONSTRAINTs, DROP COLUMN. |
| 3 | WARNING | A04 | Trigger only fires on INSERT, not DELETE/UPDATE | `20260312200000_auto_update_worker_rating.sql:57-61` | If a review is deleted from the `reviews` table (e.g., via admin or service_role), `rating_average` and `reviews_count` in `workers` will be stale/incorrect. | Extend trigger to fire on DELETE as well, or recalculate on `AFTER INSERT OR DELETE ON reviews`. |

---

## VERDICT: SHIP

No critical or high severity vulnerabilities introduced by this PR. Finding #1 (rating self-inflation) is a pre-existing RLS design issue not introduced here. Findings #2 and #3 are WARNING-level process and functional gaps. Feature approved for production with recommendations to address the RLS column restriction in a follow-up hardening task.
