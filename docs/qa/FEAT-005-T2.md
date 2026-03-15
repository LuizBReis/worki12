# QA Report: FEAT-005-T2

**Date:** 2026-03-13
**Feature:** TOS Acceptance Gate — Criar TosGateModal componente não-fechável de aceite dos Termos
**Issue:** #33
**PR:** #87 (feature/FEAT-005-T2-tos-gate-modal)
**Spec:** docs/specs/FEAT-005-tos-acceptance-gate.md — Task T2
**Tester:** qa-tester agent

---

## Build Results

| Check | Result | Details |
|-------|--------|---------|
| `npm run build` | PASS | Built in 14.80s, 0 TypeScript errors |
| `npm run test` | PASS | 31/31 tests passing |
| `npm run lint` | PASS | 0 lint errors |

---

## Acceptance Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| AC-4a | Modal fullscreen não-fechável (sem backdrop click, sem botão X) | PASS | `TosGateModal.tsx:48` — `<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">` — sem `onClick` no backdrop, sem botão X |
| AC-4b | Título "Termos de Uso Atualizados" em `font-black uppercase` | PASS | `TosGateModal.tsx:50` — `<h2 className="text-2xl font-black uppercase mb-4">Termos de Uso Atualizados</h2>` |
| AC-4c | Texto explicativo sobre Termos de Uso | PASS | `TosGateModal.tsx:52-54` — texto "Para continuar usando a Worki, você precisa aceitar nossos Termos de Uso..." |
| AC-4d | Link "Ler os Termos de Uso" para `/termos` em nova aba | PASS | `TosGateModal.tsx:56-63` — `<a href="/termos" target="_blank" rel="noopener noreferrer">Ler os Termos de Uso</a>` |
| AC-4e | Checkbox "Li e aceito os Termos de Uso e a Política de Privacidade" | PASS | `TosGateModal.tsx:66-75` — checkbox com label correto |
| AC-5 | Update no DB: `accepted_tos: true`, `tos_version: 'v1'`, `tos_accepted_at: new Date().toISOString()` | PASS | `TosGateModal.tsx:28-35` — `supabase.from(table).update({ accepted_tos: true, tos_version: 'v1', tos_accepted_at: ... }).eq('id', user.id)` |
| AC-5a | Toast "Termos aceitos com sucesso. Bem-vindo!" após aceite | PASS | `TosGateModal.tsx:43` — `addToast('Termos aceitos com sucesso. Bem-vindo!', 'success')` |
| AC-5b | Chama `onAccepted()` após sucesso para fechar o modal | PASS | `TosGateModal.tsx:44` — `onAccepted()` chamado após toast |
| AC-5c | Toast de erro "Erro ao salvar aceite dos termos. Tente novamente." se update falhar | PASS | `TosGateModal.tsx:38` — `addToast('Erro ao salvar aceite dos termos. Tente novamente.', 'error')` |
| AC-6 | Modal com `z-50` bloqueia cliques por trás | PASS | `TosGateModal.tsx:48` — `z-50` na classe do overlay |
| AC-8 | Botão desabilitado quando checkbox não marcado | PASS | `TosGateModal.tsx:80` — `disabled={!checked \|\| loading}` |
| AC-8a | Estilo `opacity-50 cursor-not-allowed` quando desabilitado | PASS | `TosGateModal.tsx:83` — `'bg-gray-400 opacity-50 cursor-not-allowed'` quando `!checked \|\| loading` |
| T2-a | Props `{ userRole: 'worker' \| 'company'; onAccepted: () => void }` | PASS | `TosGateModal.tsx:5-8` — interface `TosGateModalProps` corretamente tipada |
| T2-b | Tabela determinada por `userRole` | PASS | `TosGateModal.tsx:27` — `const table = userRole === 'worker' ? 'workers' : 'companies'` |

---

## Edge Case Results

| Category | Test | Status | Notes |
|----------|------|--------|-------|
| Double Submit | Loading state bloqueia duplo clique | PASS | `TosGateModal.tsx:16` — `if (!checked \|\| loading) return` no início do handler; `disabled={!checked \|\| loading}` no botão |
| Session Expired | Trata `!user` após getUser() | PASS | `TosGateModal.tsx:21-25` — verifica user e exibe toast "Sessão expirada" se null |
| XSS | dangerouslySetInnerHTML | PASS | Nenhuma ocorrência |

---

## Regression

31 tests passing. Sem regressões.

---

## VERDICT: SHIP

Todos os critérios da Task T2 validados. TosGateModal implementado como modal fullscreen não-fechável com checkbox, botão disabled correto, update no DB com todos os campos necessários, toast de sucesso e erro, e navegação por `onAccepted()`.
