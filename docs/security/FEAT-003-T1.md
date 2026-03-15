# Security Audit: FEAT-003-T1

**Date:** 2026-03-13
**Feature:** Notifications Page — Full Page with Filters and Pagination
**PR:** #78
**Auditor:** security-auditor agent
**Threat Model:** This task introduces `Notifications.tsx`, a full-page list of user notifications with filter tabs, pagination, and mark-as-read functionality. Data is sourced entirely from `NotificationContext`, which queries `supabase.from('notifications').eq('user_id', user.id)`. The threat model covers: (1) can a user read another user's notifications? (2) can a user mark another user's notifications as read? (3) XSS via notification content? (4) open redirect via notification `link` field?

---

## OWASP Results

| Check | Status | Details |
|-------|--------|---------|
| A01 Access Control | PASS | `Notifications.tsx` uses `useNotifications()` which in `NotificationContext.tsx:46-51` fetches only `WHERE user_id = user.id`. The notifications RLS policy (`20250209120000_create_notifications.sql:18-20`) enforces `auth.uid() = user_id` at the DB layer — even if the frontend filter were bypassed, the DB returns only the authenticated user's rows. `markAsRead` at `NotificationContext.tsx:118-121` calls `.eq('id', id)` without `user_id` filter in the WHERE, but the RLS UPDATE policy (`using: auth.uid() = user_id`) blocks updates to rows owned by other users. `markAllAsRead` at line 133-136 correctly filters `.eq('user_id', user?.id)`. Route `/notifications` is inside `<ProtectedRoute>` in `App.tsx:144`. |
| A02 Cryptographic Failures | PASS | No secrets in changed files. |
| A03 Injection | PASS | `n.title`, `n.message`, and `n.link` are rendered as plain JSX text/attributes — React escapes these by default. No `dangerouslySetInnerHTML`. |
| A04 Insecure Design | WARNING | `handleNotificationClick` at `Notifications.tsx:55-60` calls `navigate(link)` where `link` is a value from the DB (`n.link`). If an attacker could inject a malicious `link` value into the notifications table (e.g., `javascript:alert(1)` or an external URL), it could trigger a JavaScript execution or open redirect. However: (1) The INSERT policy for notifications is absent (only triggers can insert — `SECURITY DEFINER` function `notify_new_message()` controls all inserts), and (2) React Router's `navigate()` only handles relative paths within the SPA — it does not open external URLs. The `link` field in DB is controlled by trusted server-side trigger functions, not user input. Risk is LOW but noted. |
| A05 Misconfiguration | PASS | No edge functions changed. Route added inside existing `<ProtectedRoute>`. |
| A07 Authentication | PASS | `NotificationContext.tsx:32-36` — if `user` is null (no session), no DB query is made, notifications array is empty. Route is behind `<ProtectedRoute>`. |
| A09 Logging | PASS | `NotificationContext.tsx:123, 138` — `console.error` logs only the error object (no sensitive tokens or user data). |

---

## Dependency Audit

`npm audit`: 0 critical, 3 high (pre-existing minimatch/rollup), 1 moderate.

---

## Secrets Scan

No secrets found in changed files.

---

## Findings

| # | Severity | Category | Description | File:Line | Attack Scenario | Remediation |
|---|----------|----------|-------------|-----------|-----------------|-------------|
| 1 | WARNING | A04 | Notification `link` field navigated without validation | `Notifications.tsx:59` | If a malicious notification link value were injected into the DB by a compromised admin function, `navigate(link)` would execute it. React Router's `navigate()` mitigates external URL redirects but does not prevent relative path injection within the SPA. | Validate that `link` starts with `/` before calling `navigate(link)`: `if (link && link.startsWith('/')) navigate(link)`. |

---

## VERDICT: SHIP

No critical or high severity vulnerabilities found. The WARNING is a defense-in-depth recommendation. The actual risk is mitigated by: (1) notifications can only be INSERT-ed by SECURITY DEFINER trigger functions, (2) React Router prevents external URL navigation. Feature approved for production.
