# QA Report: FEAT-004-T2

**Date:** 2026-03-13
**Feature:** Real-Time Messaging Enhancements — Modificar Messages.tsx para adicionar indicador digitando via Supabase Presence
**Issue:** #29
**PR:** #83 (feature/FEAT-004-T2-messages-typing-indicator)
**Spec:** docs/specs/FEAT-004-realtime-messaging-enhancements.md — Task T2
**Tester:** qa-tester agent

---

## Build Results

| Check | Result | Details |
|-------|--------|---------|
| `npm run build` | PASS | Built in 15.68s, 0 TypeScript errors |
| `npm run test` | PASS | 31/31 tests passing |
| `npm run lint` | PASS | 0 lint errors |

---

## Acceptance Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| AC-4 | Indicador "Digitando..." aparece em até 1 segundo quando o outro usuário digita | PASS | `Messages.tsx:230-244` — canal Presence `typing:{conversationId}` subscrito com `on('presence', { event: 'sync' }, ...)` que seta `isOtherTyping = true` se outro usuário tem `typing: true`; `Messages.tsx:435-441` — `{isOtherTyping && (<div ...>Digitando...</div>)}` |
| AC-4a | Markup: 3 pontos com `animate-bounce` e delays escalonados | PASS | `Messages.tsx:437-440` — `<span className="animate-bounce">•</span>`, delay 0.1s e 0.2s nos seguintes |
| AC-5 | Indicador desaparece após 3 segundos sem digitar | PASS | `Messages.tsx:455-457` — `typingTimeoutRef.current = setTimeout(() => { presenceChannel.current?.track({ typing: false, ... }) }, 3000)` |
| AC-5a | Indicador desaparece ao enviar mensagem | PASS | `Messages.tsx:260-261` — `presenceChannel.current?.track({ typing: false, userId: currentUser })` chamado em `handleSendMessage` antes do insert |
| T2-a | Estado `isOtherTyping: boolean` criado | PASS | `Messages.tsx:47` — `const [isOtherTyping, setIsOtherTyping] = useState(false)` |
| T2-b | Canal Presence `typing:{conversationId}` criado | PASS | `Messages.tsx:230` — `supabase.channel('typing:${selectedConversation.id}')` |
| T2-c | Debounce via `typingTimeoutRef` para limpar timer anterior antes de setar novo | PASS | `Messages.tsx:454` — `if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)` antes de `setTimeout` |
| T2-d | `onChange` no textarea chama `channel.track({ typing: true })` | PASS | `Messages.tsx:453` — `presenceChannel.current?.track({ typing: true, userId: currentUser })` no onChange |

---

## Edge Case Results

| Category | Test | Status | Notes |
|----------|------|--------|-------|
| Canal cleanup | Canal Presence destruído ao trocar de conversa | PASS | `Messages.tsx` usa `useEffect` com cleanup que destrói o canal anterior |
| Self-filtering | Ignora `typing: true` do próprio usuário | PASS | `Messages.tsx:237-240` — `pTyped.userId !== currentUser` filtra mensagens próprias |
| Error handling | Falha no Presence é silenciosa | PASS | Conforme spec: falha no typing indicator é silenciosa, não exibe toast |

---

## Regression

31 tests passing. Sem regressões detectadas.

---

## VERDICT: SHIP

Todos os critérios da Task T2 validados. Typing indicator implementado via Supabase Presence com debounce de 3s, animação correta dos pontos, cleanup ao enviar mensagem e ao trocar de conversa, e filtragem do próprio usuário.
