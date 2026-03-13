# FEAT-004 — Plano de Testes Manuais de Integração: Real-Time Messaging

**Feature:** #4 — Real-Time Messaging Enhancements
**Spec:** `docs/specs/FEAT-004-realtime-messaging-enhancements.md`
**Cobertura:** AC-1 (badge de notificação), AC-2 (notificação ao destinatário), AC-4 (indicador digitando lado empresa), AC-5 (indicador desaparece após 3s)

---

## Pré-requisitos

Antes de executar os testes, garantir que:

1. **Dois usuários de teste existem no sistema:**
   - Usuário A: tipo `worker` (profissional) — logado na Aba 1
   - Usuário B: tipo `company` (empresa) — logado na Aba 2

2. **Uma conversa existente entre os dois usuários:**
   - O worker (Usuário A) deve ter aplicado a uma vaga da empresa (Usuário B)
   - A conversa deve aparecer em `/messages` (worker) e `/company/messages` (empresa)
   - Anotar o `conversationId` (visível na URL ao selecionar a conversa)

3. **Ambiente:**
   - Supabase local (`supabase start`) ou staging com Realtime habilitado
   - Supabase Realtime deve estar ativo (verificar no Dashboard → Realtime)
   - Duas abas do navegador abertas simultaneamente (ou dois navegadores diferentes)

---

## Cenário 1: Indicador digitando — worker para empresa

**Objetivo:** Verificar que a empresa vê o indicador "Digitando..." quando o worker está digitando.
**Cobre:** AC-4, AC-5

### Passos

| # | Ação | Aba |
|---|------|-----|
| 1 | Logar como **worker** (Usuário A) e navegar para `/messages?conversation={conversationId}` | Aba 1 |
| 2 | Logar como **empresa** (Usuário B) e navegar para `/company/messages?conversation={conversationId}` | Aba 2 |
| 3 | Na Aba 1 (worker), clicar no campo de mensagem e começar a digitar qualquer texto | Aba 1 |
| 4 | Observar a Aba 2 (empresa) em até 1 segundo | Aba 2 |
| 5 | Parar de digitar na Aba 1 e aguardar 3 segundos sem nenhuma ação | Aba 1 |
| 6 | Observar a Aba 2 novamente | Aba 2 |

### Resultado Esperado

- **Passo 4:** A Aba 2 (empresa) deve exibir o indicador "• • • Digitando..." abaixo da área de mensagens, antes do campo de input.
- **Passo 6:** O indicador "Digitando..." deve desaparecer automaticamente da Aba 2 após os 3 segundos de inatividade do worker.

### Resultado de Falha

- Indicador não aparece na Aba 2 → verificar se Supabase Realtime está habilitado e se o Presence channel `typing:{conversationId}` está sendo criado (verificar console do navegador).
- Indicador não desaparece após 3s → verificar o `typingTimeoutRef` e o debounce no `onChange` de `CompanyMessages.tsx`.

---

## Cenário 2: Indicador digitando — empresa para worker

**Objetivo:** Verificar que o worker vê o indicador "Digitando..." quando a empresa está digitando, e que o indicador desaparece ao enviar a mensagem.
**Cobre:** AC-4, AC-5

### Passos

| # | Ação | Aba |
|---|------|-----|
| 1 | Logar como **worker** (Usuário A) e navegar para `/messages?conversation={conversationId}` | Aba 1 |
| 2 | Logar como **empresa** (Usuário B) e navegar para `/company/messages?conversation={conversationId}` | Aba 2 |
| 3 | Na Aba 2 (empresa), clicar no campo de mensagem e começar a digitar uma mensagem | Aba 2 |
| 4 | Observar a Aba 1 (worker) em até 1 segundo | Aba 1 |
| 5 | Na Aba 2 (empresa), enviar a mensagem (pressionar Enter ou clicar em Enviar) | Aba 2 |
| 6 | Observar a Aba 1 imediatamente após o envio | Aba 1 |

### Resultado Esperado

- **Passo 4:** A Aba 1 (worker) deve exibir o indicador "• • • Digitando..." abaixo da área de mensagens.
- **Passo 6:** O indicador "Digitando..." deve desaparecer imediatamente da Aba 1 assim que a empresa envia a mensagem (o `track({ typing: false })` é chamado antes do insert).

### Resultado de Falha

- Indicador não aparece na Aba 1 → verificar se `Messages.tsx` tem o Presence channel configurado corretamente (ver PR #83 — FEAT-004-T2).
- Indicador não some após o envio → verificar se `presenceChannel.current?.track({ typing: false })` é chamado em `handleSendMessage` antes do insert.

---

## Cenário 3: Badge de notificação ao receber mensagem

**Objetivo:** Verificar que o worker recebe um badge de notificação no `NotificationBell` quando a empresa envia uma mensagem e o worker NÃO está com a conversa aberta.
**Cobre:** AC-1, AC-2

### Passos

| # | Ação | Aba |
|---|------|-----|
| 1 | Logar como **worker** (Usuário A) e navegar para `/dashboard` (NÃO abrir a página de mensagens) | Aba 1 |
| 2 | Logar como **empresa** (Usuário B) e navegar para `/company/messages?conversation={conversationId}` | Aba 2 |
| 3 | Na Aba 2 (empresa), enviar uma nova mensagem ao worker | Aba 2 |
| 4 | Observar o `NotificationBell` (ícone de sino) no header da Aba 1 em até 3 segundos | Aba 1 |
| 5 | Clicar na notificação que aparece no dropdown do `NotificationBell` | Aba 1 |
| 6 | Observar para onde o worker é redirecionado | Aba 1 |

### Resultado Esperado

- **Passo 4:** O `NotificationBell` deve exibir um badge vermelho com o número de notificações não lidas maior que 0. Ao abrir o dropdown, deve aparecer uma notificação do tipo "message" referente à mensagem enviada pela empresa.
- **Passo 6:** O worker deve ser redirecionado para `/messages?conversation={conversationId}`.

### Resultado de Falha

- Badge não aparece → verificar se a migration `20260312000000_notify_on_new_message.sql` foi aplicada (ver FEAT-004-T1). Verificar no Supabase Dashboard se a tabela `notifications` tem o novo registro.
- Clique na notificação não redireciona → verificar o campo `link` na tabela `notifications` e a função `handleNotificationClick` em `NotificationBell.tsx`.

---

## Observação: AC-3 — Notificação quando destinatário está no chat

Quando o worker está com a conversa aberta (`/messages?conversation={id}`) e a empresa envia uma mensagem, o trigger do banco **cria a notificação normalmente**. Porém, o comportamento esperado é que ela seja marcada como lida automaticamente — pois ao abrir a conversa, o `markAsRead` é chamado para todas as mensagens não lidas.

Portanto, neste cenário, o badge de notificação pode aparecer brevemente e desaparecer em seguida. Isso é comportamento correto — não é um bug.

---

## Dependências de PRs

| PR | Task | Status |
|----|------|--------|
| #82 | FEAT-004-T1 — Migration trigger de notificação | Aguardando review |
| #83 | FEAT-004-T2 — Typing indicator em Messages.tsx | Aguardando review |
| #84 | FEAT-004-T3 — Typing indicator em CompanyMessages.tsx | Aguardando review |
