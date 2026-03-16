# Security Audit: FEAT-009-T1

**Date:** 2026-03-15
**Feature:** Configurar source maps hidden no vite.config.ts para Sentry
**PR:** #104
**Auditor:** security-auditor agent
**Threat Model:** Adds `build: { sourcemap: 'hidden' }` to Vite config. Hidden source maps are generated during build but NOT served to browsers (no `//# sourceMappingURL=` comment in output JS). This is a security IMPROVEMENT — source maps expose original source code to anyone inspecting the browser, and hiding them prevents this while still allowing Sentry to process them server-side.

---

## OWASP Results

| Check | Status | Details |
|-------|--------|---------|
| A01 Access Control | PASS | Build config change — no access control implications. |
| A02 Cryptographic Failures | PASS | This change IMPROVES security by hiding source maps from the browser. Original source code is no longer exposed to end users via browser DevTools. |
| A03 Injection | PASS | N/A — build config. |
| A04 Insecure Design | PASS | N/A — build config. |
| A05 Misconfiguration | PASS | `sourcemap: 'hidden'` is the correct Vite setting for production with Sentry. `'hidden'` generates `.js.map` files but does not add the sourceMappingURL comment — correct behavior. |
| A07 Authentication | PASS | N/A. |
| A09 Logging | PASS | N/A. |

---

## Dependency Audit

`npm audit`: 0 critical, 4 high (pre-existing)

---

## Secrets Scan

No secrets found. `vite.config.ts` contains no sensitive values.

---

## Migration Risk Assessment

No SQL migrations. N/A.

---

## Findings

Nenhuma vulnerabilidade encontrada.

---

## VERDICT: SHIP

Nenhuma vulnerabilidade critica ou alta encontrada. Feature aprovada para producao. Esta mudanca MELHORA a seguranca ao esconder source maps do browser.
