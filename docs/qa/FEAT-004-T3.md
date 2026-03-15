# QA Report: FEAT-004-T3

**Date:** 2026-03-13
**Feature:** Real-Time Messaging Enhancements — Modificar CompanyMessages.tsx com indicador digitando
**Issue:** #30
**PR:** #84 (feature/FEAT-004-T3-company-messages-typing-indicator)
**Spec:** docs/specs/FEAT-004-realtime-messaging-enhancements.md — Task T3
**Tester:** qa-tester agent

---

**Nota:** Issue #30 tem labels duplicadas `stage:dev` E `stage:qa` simultaneamente, o que indica inconsistência no estado do pipeline. O código no branch foi inspecionado e está completo — QA realizado da mesma forma.

---

## Build Results

| Check | Result | Details |
|-------|--------|---------|
| `npm run build` | PASS | Built in 15.35s, 0 TypeScript errors |
| `npm run test` | PASS | 31/31 tests passing |
| `npm run lint` | PASS | 0 lint errors |

---

## Acceptance Criteria

Task T3 replica as mudanças de T2 em `CompanyMessages.tsx`.

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| AC-4 | Indicador "Digitando..." aparece em CompanyMessages quando o worker está digitando | PASS | `CompanyMessages.tsx:265-280` — canal Presence `typing:{conversationId}` com `on('presence', 'sync', ...)` e `setIsOtherTyping`; `CompanyMessages.tsx:472-478` — `{isOtherTyping && (<div>...Digitando...</div>)}` |
| AC-5 | Indicador desaparece após 3 segundos de inatividade | PASS | `CompanyMessages.tsx:491-492` — `typingTimeoutRef.current = setTimeout(() => { channel.track({ typing: false }) }, 3000)` |
| AC-5a | Indicador desaparece ao enviar mensagem | PASS | `CompanyMessages.tsx:296` — `presenceChannel.current?.track({ typing: false, ... })` em `handleSendMessage` |
| T3-a | Estado `isOtherTyping: boolean` | PASS | `CompanyMessages.tsx:46` — `const [isOtherTyping, setIsOtherTyping] = useState(false)` |
| T3-b | Canal Presence `typing:{conversationId}` | PASS | `CompanyMessages.tsx:266` — `supabase.channel('typing:${selectedConversation.id}')` |
| T3-c | Debounce via `typingTimeoutRef` | PASS | `CompanyMessages.tsx:490` — `clearTimeout(typingTimeoutRef.current)` antes de setTimeout |
| T3-d | Filtra `typing` do próprio usuário | PASS | `CompanyMessages.tsx:273-274` — `pTyped.userId !== currentUser` |

---

## Edge Case Results

| Category | Test | Status | Notes |
|----------|------|--------|-------|
| Paridade com T2 | Mesmo padrão de Messages.tsx | PASS | Implementação idêntica ao Messages.tsx — refs, estado, canal, debounce, markup |
| Self-filtering | Empresa não vê indicador do próprio input | PASS | Filtro `userId !== currentUser` implementado |

---

## Regression

31 tests passing. Sem regressões detectadas.

---

## VERDICT: SHIP

Todos os critérios da Task T3 validados. CompanyMessages.tsx implementa o mesmo padrão de typing indicator de Messages.tsx (T2), com Presence channel, debounce de 3s, animação, e filtragem correta.
