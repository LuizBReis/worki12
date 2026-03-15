# Security Audit: FEAT-004-T2

**Date:** 2026-03-13
**Feature:** Messages.tsx — Typing Indicator via Supabase Presence
**PR:** #83
**Auditor:** security-auditor agent
**Threat Model:** This task adds Supabase Realtime Presence to `Messages.tsx` for a typing indicator. A presence channel `typing:{conversationId}` is created per conversation. The data tracked is `{ typing: boolean, userId: string }`. The threat model covers: (1) can a user join presence channels for conversations they are not part of? (2) can `userId` in presence payload be spoofed to impersonate another user? (3) information leakage via presence state?

---

## OWASP Results

| Check | Status | Details |
|-------|--------|---------|
| A01 Access Control | WARNING | `Messages.tsx:228-240` — The presence channel name is `typing:{selectedConversation.id}`. Any authenticated Supabase user can subscribe to `supabase.channel('typing:{anyConversationId}')` — Supabase Presence channels are not access-controlled by RLS. An attacker who knows a conversation ID could join the presence channel for that conversation and see the `{ typing: true, userId: 'X' }` presence state of legitimate participants. This leaks: (a) that user `X` is currently typing in conversation `Y`, (b) the user IDs of participants in that conversation. However, this requires knowing the `conversationId` UUID (not easily guessable), and the leaked information is minimal (typing state + userId). The actual message content is NOT leaked via presence. |
| A02 Cryptographic Failures | PASS | No secrets in changed files. |
| A03 Injection | WARNING | `Messages.tsx:265` — `presenceChannel.current?.track({ typing: true, userId: currentUser })` where `currentUser` is set from `supabase.auth.getUser()` at line ~50. However, the **receiving side** at line 233-241 reads `pTyped.userId` from the presence state and compares it to `currentUser` (`pTyped.userId !== currentUser`). An attacker could join the same presence channel and broadcast `{ typing: true, userId: 'victim-user-id' }` — this would cause the victim's counterpart to see "Digitando..." attributed to the victim even when the victim is not typing. This is a **presence spoofing** issue: the `userId` in the Supabase Presence payload is client-controlled and not validated server-side. Impact: false "typing" indicator — annoying but not a data breach or financial risk. |
| A04 Insecure Design | PASS | No financial operations. Typing indicator is UI-only. Worst-case impact of presence spoofing is a false typing indicator — not a security breach. |
| A05 Misconfiguration | PASS | No edge functions, no CORS. Presence channel is created with user's JWT — Supabase validates JWT for channel subscription. |
| A07 Authentication | PASS | `Messages.tsx` already has auth check via `supabase.auth.getUser()` on mount. The presence channel is only created when `selectedConversation` exists (meaning user is already authenticated and has loaded conversations). |
| A09 Logging | PASS | No sensitive data logged in changed code. |

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
| 1 | WARNING | A01 | Supabase Presence channels are not RLS-protected | `Messages.tsx:228` — `supabase.channel('typing:${selectedConversation.id}')` | An authenticated user who knows a conversation UUID can join the presence channel and observe participant typing states and user IDs, even if they are not a conversation participant. | This is a Supabase platform limitation — Presence channels have no RLS. Mitigation: presence data leaks only typing state and UUID (not message content). If conversation UUIDs are treated as unguessable tokens (UUID v4), practical exploitability is very low. For additional hardening, consider using a hashed/derived channel name. |
| 2 | WARNING | A03 | Presence `userId` field is client-controlled and can be spoofed | `Messages.tsx:236` — `pTyped.userId !== currentUser` | Attacker subscribes to `typing:{conversationId}` and calls `channel.track({ typing: true, userId: 'victim-id' })`. The legitimate counterpart sees "Digitando..." attributed to the victim when they are not typing. | Do not trust `userId` from presence payload. Instead, use the presence key (which Supabase sets automatically from the channel's socket id) for deduplication. Or validate typing display by checking if the user in the presence state is the known counterpart of the conversation (fetched from DB). |

---

## VERDICT: SHIP

No critical or high severity vulnerabilities found. Both findings are WARNING-level: the Supabase Presence limitation is a platform constraint applicable to all Supabase apps (not a code defect), and the presence spoofing attack produces only a false typing indicator with zero financial or data-breach impact. Feature approved for production with recommendations noted.
