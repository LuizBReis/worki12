# QA Report: FEAT-005-T5

**Date:** 2026-03-13
**Feature:** TOS Acceptance Gate — Modificar CompanyOnboarding para exigir checkbox de TOS no passo final
**Issue:** #36
**PR:** #90 (feature/FEAT-005-T5-company-onboarding-tos-checkbox)
**Spec:** docs/specs/FEAT-005-tos-acceptance-gate.md — Task T5
**Tester:** qa-tester agent

---

## Build Results

| Check | Result | Details |
|-------|--------|---------|
| `npm run build` | PASS | Built in 15.71s, 0 TypeScript errors |
| `npm run test` | PASS | 31/31 tests passing |
| `npm run lint` | PASS | 0 lint errors |

---

## Acceptance Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| AC-2 | Step 2 (último) de CompanyOnboarding exibe checkbox de TOS | PASS | `CompanyOnboarding.tsx:278-280` — `<input type="checkbox" checked={tosAccepted} ...>` no passo 2 |
| AC-2a | Botão "Finalizar" desabilitado quando checkbox não marcado | PASS | `CompanyOnboarding.tsx:82,310` — `canProceed()` para step 2 retorna `tosAccepted`; botão usa `disabled={loading \|\| !canProceed()}` |
| AC-3 | Submit inclui `accepted_tos: true`, `tos_version: 'v1'`, `tos_accepted_at` no upsert | PASS | `CompanyOnboarding.tsx:112-114` — `accepted_tos: true, tos_version: 'v1', tos_accepted_at: new Date().toISOString()` no payload do upsert de `companies` |
| T5-a | Estado `tosAccepted: boolean` (default `false`) | PASS | `CompanyOnboarding.tsx:14` — `const [tosAccepted, setTosAccepted] = useState(false)` |
| T5-b | Checkbox no último passo (step 2) | PASS | `CompanyOnboarding.tsx:278` — dentro do bloco condicional do step 2 |

---

## Edge Case Results

| Category | Test | Status | Notes |
|----------|------|--------|-------|
| Step 2 only check | `canProceed()` para step 2 retorna apenas `tosAccepted` | PASS | `CompanyOnboarding.tsx:82` — `case 2: return tosAccepted` — empresa não precisa de outros campos preenchidos no step 2 para finalizar |
| Tabela correta | Upsert vai para `companies`, não `workers` | PASS | `CompanyOnboarding.tsx` — upsert na tabela `companies` já era o comportamento existente |

---

## Regression

31 tests passing. Sem regressões.

---

## VERDICT: SHIP

Todos os critérios da Task T5 validados. CompanyOnboarding agora exige aceite de TOS no step 2 (último), com botão "Finalizar" bloqueado até checkbox marcado, e campos de TOS incluídos no upsert de `companies`.
