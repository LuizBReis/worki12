# QA Report: FEAT-006-T1

**Date:** 2026-03-13
**Feature:** Worker Rating & Review System — Criar migration SQL com trigger de atualização automática de rating
**Issue:** #38
**PR:** #92 (feature/FEAT-006-T1-auto-update-worker-rating-trigger)
**Spec:** docs/specs/FEAT-006-worker-rating-review-system.md — Task T1
**Tester:** qa-tester agent

---

## Build Results

| Check | Result | Details |
|-------|--------|---------|
| `npm run build` | PASS | Built in 32.14s, 0 TypeScript errors |
| `npm run test` | PASS | 31/31 tests passing |
| `npm run lint` | PASS | 0 lint errors |

---

## Acceptance Criteria

Task T1 é uma migration SQL pura.

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| T1-a | Arquivo migration `20260312200000_auto_update_worker_rating.sql` existe | PASS | `supabase/migrations/20260312200000_auto_update_worker_rating.sql` presente |
| T1-b | `ALTER TABLE workers ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0 NOT NULL` | PASS | `20260312200000_auto_update_worker_rating.sql:5-6` — coluna `reviews_count` adicionada corretamente |
| T1-c | Backfill de `reviews_count` para workers existentes | PASS | `20260312200000_auto_update_worker_rating.sql:9-12` — `UPDATE workers w SET reviews_count = (SELECT COUNT(*) FROM reviews r WHERE r.reviewed_id = w.id)` |
| T1-d | Backfill de `rating_average` para workers existentes com reviews | PASS | `20260312200000_auto_update_worker_rating.sql:15-19` — `UPDATE workers w SET rating_average = (SELECT COALESCE(AVG(r.rating), 0) ...) WHERE EXISTS (...)` |
| AC-4 | Constraint `UNIQUE (job_id, reviewer_id, reviewed_id)` previne dupla avaliação | PASS | `20260312200000_auto_update_worker_rating.sql:22-24` — `ALTER TABLE reviews ADD CONSTRAINT reviews_unique_per_job UNIQUE (job_id, reviewer_id, reviewed_id)` |
| AC-6 | Constraint `CHECK (reviewer_id <> reviewed_id)` previne auto-avaliação | PASS | `20260312200000_auto_update_worker_rating.sql:27-29` — `ALTER TABLE reviews ADD CONSTRAINT reviews_no_self_review CHECK (reviewer_id <> reviewed_id)` |
| AC-1 | Função `update_worker_rating_on_review()` com `SECURITY DEFINER` | PASS | `20260312200000_auto_update_worker_rating.sql:32-55` — função criada com `SECURITY DEFINER SET search_path = public` |
| AC-1a | Trigger AFTER INSERT recalcula `rating_average` com `ROUND(AVG(rating)::numeric, 1)` | PASS | `20260312200000_auto_update_worker_rating.sql:41-44` — `rating_average = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE reviewed_id = NEW.reviewed_id)` |
| AC-1b | Trigger AFTER INSERT recalcula `reviews_count` | PASS | `20260312200000_auto_update_worker_rating.sql:45-49` — `reviews_count = (SELECT COUNT(*) FROM reviews WHERE reviewed_id = NEW.reviewed_id)` |
| T1-e | `DROP TRIGGER IF EXISTS` antes de criar (idempotente) | PASS | `20260312200000_auto_update_worker_rating.sql:58` — `DROP TRIGGER IF EXISTS trg_update_worker_rating ON reviews` |
| T1-f | Trigger `trg_update_worker_rating` AFTER INSERT na tabela `reviews` | PASS | `20260312200000_auto_update_worker_rating.sql:59-62` — `CREATE TRIGGER trg_update_worker_rating AFTER INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION update_worker_rating_on_review()` |
| T1-g | Timestamp `20260312200000` maior que migrations anteriores | PASS | Maior que `20260312100000` (tos) e `20260312000000` (notify) |

---

## Edge Case Results

| Category | Test | Status | Notes |
|----------|------|--------|-------|
| Idempotência | `ADD COLUMN IF NOT EXISTS` e `DROP TRIGGER IF EXISTS` | PASS | Migration pode ser re-executada sem erro |
| Arredondamento | `ROUND(AVG(rating)::numeric, 1)` — 1 casa decimal | PASS | `20260312200000_auto_update_worker_rating.sql:42` — arredondamento correto |
| Workers sem reviews | Backfill usa `WHERE EXISTS` para não sobrescrever `rating_average` de workers sem reviews | PASS | `20260312200000_auto_update_worker_rating.sql:19` — cláusula `WHERE EXISTS` |

---

## Regression

31 tests passing. Migration não altera código frontend.

---

## VERDICT: SHIP

Todos os critérios da Task T1 validados. Migration implementa corretamente: coluna `reviews_count` com backfill, constraints de unicidade e auto-avaliação, função trigger com SECURITY DEFINER que recalcula `rating_average` e `reviews_count`, e trigger AFTER INSERT idempotente.
