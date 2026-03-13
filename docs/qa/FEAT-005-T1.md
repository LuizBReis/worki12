# QA Report: FEAT-005-T1

**Date:** 2026-03-13
**Feature:** TOS Acceptance Gate — Criar migration SQL com colunas accepted_tos em workers e companies
**Issue:** #32
**PR:** #86 (feature/FEAT-005-T1-add-tos-acceptance-migration)
**Spec:** docs/specs/FEAT-005-tos-acceptance-gate.md — Task T1
**Tester:** qa-tester agent

---

## Build Results

| Check | Result | Details |
|-------|--------|---------|
| `npm run build` | PASS | Built in 15.09s, 0 TypeScript errors |
| `npm run test` | PASS | 31/31 tests passing |
| `npm run lint` | PASS | 0 lint errors |

---

## Acceptance Criteria

Task T1 é uma migration SQL pura.

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| T1-a | Arquivo migration `20260312100000_add_tos_acceptance.sql` existe | PASS | `supabase/migrations/20260312100000_add_tos_acceptance.sql` presente |
| T1-b | Tabela `workers`: coluna `accepted_tos BOOLEAN DEFAULT FALSE NOT NULL` | PASS | `20260312100000_add_tos_acceptance.sql:5-6` — `ALTER TABLE workers ADD COLUMN IF NOT EXISTS accepted_tos BOOLEAN DEFAULT FALSE NOT NULL` |
| T1-c | Tabela `workers`: coluna `tos_version TEXT DEFAULT NULL` | PASS | `20260312100000_add_tos_acceptance.sql:7` — `ADD COLUMN IF NOT EXISTS tos_version TEXT DEFAULT NULL` |
| T1-d | Tabela `workers`: coluna `tos_accepted_at TIMESTAMPTZ DEFAULT NULL` | PASS | `20260312100000_add_tos_acceptance.sql:8` — `ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ DEFAULT NULL` |
| T1-e | Tabela `companies`: mesmas 3 colunas | PASS | `20260312100000_add_tos_acceptance.sql:11-14` — `ALTER TABLE companies` com as mesmas 3 colunas |
| T1-f | Uso de `ADD COLUMN IF NOT EXISTS` (idempotente) | PASS | Ambos os `ALTER TABLE` usam `IF NOT EXISTS` |
| T1-g | Timestamp `20260312100000` em ordem correta | PASS | Entre `20260312000000` (notify_message) e `20260312200000` (rating) — ordem correta |
| AC-3 | Campos `accepted_tos`, `tos_version`, `tos_accepted_at` disponíveis para upsert no onboarding | PASS | Colunas criadas com tipos corretos — BOOLEAN, TEXT, TIMESTAMPTZ |

---

## Edge Case Results

| Category | Test | Status | Notes |
|----------|------|--------|-------|
| Idempotência | `IF NOT EXISTS` em todos os `ADD COLUMN` | PASS | Pode ser re-aplicada sem erro |
| Default values | `accepted_tos DEFAULT FALSE` garante que usuários existentes NÃO passam o gate automaticamente | PASS | Conforme spec: usuários existentes sem aceite vão para o modal |

---

## Regression

31 tests passing. Migration não altera código frontend.

---

## VERDICT: SHIP

Todos os critérios da Task T1 validados. Migration cria corretamente as 3 colunas em `workers` e `companies` com tipos, defaults e idempotência corretos.
