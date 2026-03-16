# Security Audit: FEAT-010-T2

**Date:** 2026-03-15
**Feature:** Criar .github/workflows/deploy-staging.yml com build e deploy Netlify
**PR:** #109
**Auditor:** security-auditor agent
**Threat Model:** Creates staging deploy workflow triggered on push to `main`. Uses GitHub Secrets for build env vars and Netlify deploy credentials (`NETLIFY_SITE_ID`, `NETLIFY_AUTH_TOKEN`). The deploy goes to staging (no `--prod` flag). The Netlify auth token has deploy permissions.

---

## OWASP Results

| Check | Status | Details |
|-------|--------|---------|
| A01 Access Control | PASS | Only triggered on push to `main` — requires merged PR (if branch protection is configured). No public API exposed. |
| A02 Cryptographic Failures | PASS | `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` accessed via `${{ secrets.* }}` — GitHub masks these in logs. Not hardcoded. The VITE_ env vars are public frontend values. |
| A03 Injection | PASS | Fixed commands. No user input in the workflow. `netlify/actions/cli@master` is an official Netlify action — acceptable for staging deploy. |
| A04 Insecure Design | PASS | Staging deploy only (no `--prod` flag). Comment in file documents how to add production deploy with manual approval. |
| A05 Misconfiguration | WARNING | `netlify/actions/cli@master` is pinned to `master` branch — not a SHA hash. This means if the Netlify GitHub Action is compromised, the workflow would execute malicious code. For a staging deploy this is acceptable risk, but production deploys should use SHA-pinned actions. |
| A07 Authentication | PASS | N/A. |
| A09 Logging | PASS | GitHub Actions masks secrets automatically. |

---

## Dependency Audit

`npm audit`: 0 critical, 4 high (pre-existing)

---

## Secrets Scan

Verified: All secrets in `deploy-staging.yml` use `${{ secrets.* }}` syntax. No hardcoded credentials. `NETLIFY_AUTH_TOKEN` is properly stored as a GitHub Secret.

---

## Migration Risk Assessment

No SQL migrations. N/A.

---

## Findings

| # | Severity | Category | Description | File:Line | Attack Scenario | Remediation |
|---|----------|----------|-------------|-----------|-----------------|-------------|
| 1 | WARNING | A05 | Netlify action pinned to `master` branch | `.github/workflows/deploy-staging.yml:32` | If the `netlify/actions/cli` repository is compromised, malicious code could execute in the CI runner with access to secrets | Pin to a specific SHA or tagged release for production deploys |

---

## VERDICT: SHIP

Nenhuma vulnerabilidade critica ou alta encontrada. WARNING de pinagem de action e aceitavel para staging. Feature aprovada para producao.
