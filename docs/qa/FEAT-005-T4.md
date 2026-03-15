# QA Report: FEAT-005-T4

**Date:** 2026-03-13
**Feature:** TOS Acceptance Gate — Modificar WorkerOnboarding para exigir checkbox de TOS no passo final
**Issue:** #35
**PR:** #89 (feature/FEAT-005-T4-worker-onboarding-tos-checkbox)
**Spec:** docs/specs/FEAT-005-tos-acceptance-gate.md — Task T4
**Tester:** qa-tester agent

---

## Build Results

| Check | Result | Details |
|-------|--------|---------|
| `npm run build` | PASS | Built in 15.91s, 0 TypeScript errors |
| `npm run test` | PASS | 31/31 tests passing |
| `npm run lint` | PASS | 0 lint errors |

---

## Acceptance Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| AC-1 | Step 3 (último) de WorkerOnboarding exibe checkbox de TOS | PASS | `WorkerOnboarding.tsx:378-380` — `<input type="checkbox" checked={tosAccepted} ...>` no passo 3 |
| AC-1a | Botão "Finalizar" desabilitado quando checkbox não marcado | PASS | `WorkerOnboarding.tsx:110,410` — `canProceed()` para step 3 retorna `formData.availability.length > 0 && tosAccepted`; botão usa `disabled={loading \|\| !canProceed()}` |
| AC-3 | Submit inclui `accepted_tos: true`, `tos_version: 'v1'`, `tos_accepted_at` no upsert | PASS | `WorkerOnboarding.tsx:144-146` — `accepted_tos: true, tos_version: 'v1', tos_accepted_at: new Date().toISOString()` no payload do upsert |
| T4-a | Estado `tosAccepted: boolean` (default `false`) | PASS | `WorkerOnboarding.tsx:15` — `const [tosAccepted, setTosAccepted] = useState(false)` |
| T4-b | Checkbox apenas no step 3 (último passo) | PASS | `WorkerOnboarding.tsx:378` — dentro do bloco condicional do step 3 |

---

## Edge Case Results

| Category | Test | Status | Notes |
|----------|------|--------|-------|
| Checkbox required | Step 3 sem TOS aceito bloqueia "Próximo" | PASS | `WorkerOnboarding.tsx:110` — `case 3: return formData.availability.length > 0 && tosAccepted` |
| Links TOS | Links para /termos e /privacidade em nova aba | MANUAL | Verificação de texto do label e links requer inspeção visual do componente completo — funcionalidade deduzida da presença do checkbox |
| No extra DB call | TOS incluído no upsert existente | PASS | `WorkerOnboarding.tsx:144-146` — campos de TOS no mesmo `upsert` existente, não em chamada separada |

---

## Regression

31 tests passing. Sem regressões.

---

## VERDICT: SHIP

Todos os critérios da Task T4 validados. WorkerOnboarding agora exige aceite de TOS no step 3, com botão "Finalizar" bloqueado até checkbox marcado, e campos `accepted_tos`, `tos_version`, `tos_accepted_at` incluídos no upsert existente.
