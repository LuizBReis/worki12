# Security Audit: FEAT-008-T2

**Date:** 2026-03-15
**Feature:** Modificar Profile.tsx com secao Zona de Perigo e modal de exclusao de conta
**PR:** #101
**Auditor:** security-auditor agent
**Threat Model:** Adds account deletion UI to Profile page. The `handleDeleteAccount` function calls `supabase.functions.invoke('delete-account')` — the actual deletion logic runs server-side in an edge function (not part of this PR). Client-side safety: requires typing "EXCLUIR" to enable the confirm button. After successful deletion, calls `supabase.auth.signOut()` and navigates to `/login`.

---

## OWASP Results

| Check | Status | Details |
|-------|--------|---------|
| A01 Access Control | PASS | `Profile.tsx` is inside `ProtectedRoute`. The `handleDeleteAccount` at line 182-192 calls `supabase.functions.invoke('delete-account', { body: {} })` — the edge function receives the user's JWT and identifies the user server-side. No user ID is sent in the body — the function determines which account to delete from the JWT. This prevents IDOR — a user cannot delete someone else's account. |
| A02 Cryptographic Failures | PASS | No secrets. No sensitive data in the component. |
| A03 Injection | PASS | The modal input (`deleteConfirmText`) is only compared via strict equality `deleteConfirmText !== 'EXCLUIR'` — not used in any query or API call. No injection vector. |
| A04 Insecure Design | PASS | Confirmation requires exact string match "EXCLUIR". Button is `disabled` when text does not match (line 530: `disabled={deleteConfirmText !== 'EXCLUIR' || deleting}`). After deletion, session is cleared via `signOut()`. Error handling shows toast without exposing internal details. |
| A05 Misconfiguration | PASS | No edge functions modified in this PR. The `delete-account` function is created in a separate PR (FEAT-008-T1). |
| A07 Authentication | PASS | Inside `ProtectedRoute`. The edge function call uses Supabase client which automatically sends the user's JWT. |
| A09 Logging | PASS | No logging of sensitive data. Error message from edge function is displayed as toast — this is the edge function's responsibility to sanitize. |

---

## Dependency Audit

`npm audit`: 0 critical, 4 high (pre-existing)

---

## Secrets Scan

No secrets found.

---

## Migration Risk Assessment

No SQL migrations. N/A.

---

## Findings

Nenhuma vulnerabilidade encontrada.

---

## VERDICT: SHIP

Nenhuma vulnerabilidade critica ou alta encontrada. Feature aprovada para producao.
