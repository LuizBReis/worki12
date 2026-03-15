# QA Report: FEAT-004-T1

**Date:** 2026-03-13
**Feature:** Real-Time Messaging Enhancements — Migration SQL com trigger de notificação em novas mensagens
**Issue:** #28
**PR:** #82 (feature/FEAT-004-T1-message-notification-trigger)
**Spec:** docs/specs/FEAT-004-realtime-messaging-enhancements.md — Task T1
**Tester:** qa-tester agent

---

## Build Results

| Check | Result | Details |
|-------|--------|---------|
| `npm run build` | PASS | Built in 18.62s, 0 TypeScript errors |
| `npm run test` | PASS | 31/31 tests passing |
| `npm run lint` | PASS | 0 lint errors |

---

## Acceptance Criteria

Task T1 é uma migration SQL. Os ACs dependentes (AC-1, AC-2, AC-7) são verificáveis apenas via inspeção do SQL.

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| AC-1/2 | Trigger cria notificação `type: 'message'` para o destinatário | PASS | `20260312000000_notify_on_new_message.sql:52-63` — INSERT em `notifications` com `type='message'`, `user_id=v_recipient_id` |
| AC-6 | Link da notificação aponta para `/messages?conversation={conversationId}` | PASS | `20260312000000_notify_on_new_message.sql:58` — `'/messages?conversation=' \|\| v_conversation_id::text` |
| AC-7 | Notificação criada apenas para o destinatário (não para o remetente) | PASS | `20260312000000_notify_on_new_message.sql:37-41` — lógica: `IF senderid = v_worker_id THEN recipient = company ELSE recipient = worker` |
| T1-a | Função `notify_new_message()` criada com `SECURITY DEFINER` | PASS | `20260312000000_notify_on_new_message.sql:5-8` — `CREATE OR REPLACE FUNCTION notify_new_message() ... SECURITY DEFINER` |
| T1-b | Trigger `trg_notify_new_message` AFTER INSERT na tabela `"Message"` | PASS | `20260312000000_notify_on_new_message.sql:68-73` — `CREATE TRIGGER trg_notify_new_message AFTER INSERT ON "Message" FOR EACH ROW EXECUTE FUNCTION notify_new_message()` |
| T1-c | `DROP TRIGGER IF EXISTS` antes de criar (idempotente) | PASS | `20260312000000_notify_on_new_message.sql:69` — `DROP TRIGGER IF EXISTS trg_notify_new_message ON "Message"` |
| T1-d | `ON CONFLICT DO NOTHING` previne duplicatas | PASS | `20260312000000_notify_on_new_message.sql:62` — `ON CONFLICT DO NOTHING` |
| T1-e | Timestamp `20260312000000` maior que migrations anteriores | PASS | Verificado contra `supabase/migrations/` — migration mais recente anterior era `20260311200000` |

---

## Edge Case Results

| Category | Test | Status | Notes |
|----------|------|--------|-------|
| NULL conversation | Retorna NEW sem criar notificação se `application_uuid` é NULL | PASS | `20260312000000_notify_on_new_message.sql:26-28` — `IF v_app_id IS NULL THEN RETURN NEW` |
| Sender name fallback | Usa "Usuário" se nome não encontrado | PASS | `20260312000000_notify_on_new_message.sql:44-49` — `COALESCE(w.full_name, comp.name, 'Usuário')` |
| Content truncation | Máximo 100 chars no preview | PASS | `20260312000000_notify_on_new_message.sql:57` — `LEFT(NEW.content, 100)` |

---

## Regression

31 tests passing. Migration não altera código frontend — sem regressões.

---

## VERDICT: SHIP

Todos os critérios da Task T1 validados. Migration SQL implementa corretamente a função trigger `notify_new_message()` com SECURITY DEFINER, o trigger AFTER INSERT em `"Message"`, lógica de destinatário correta, link da notificação com conversationId, e proteções contra NULL e duplicatas.
