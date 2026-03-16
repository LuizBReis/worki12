# Deployment - Worki CI/CD Pipeline

## Secrets necessarios

Adicionar em **Settings > Secrets and variables > Actions** no repositorio GitHub:

| Secret | Descricao | Onde encontrar |
|--------|-----------|----------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Supabase Dashboard > Settings > API > Project URL |
| `VITE_SUPABASE_ANON_KEY` | Chave anonima do Supabase | Supabase Dashboard > Settings > API > anon public |
| `VITE_SENTRY_DSN` | DSN do projeto Sentry | Sentry > Settings > Projects > Worki > Client Keys (DSN) |
| `NETLIFY_SITE_ID` | ID do site Netlify | Netlify > Site settings > General > Site ID |
| `NETLIFY_AUTH_TOKEN` | Token de acesso pessoal Netlify | Netlify > User settings > Applications > Personal access tokens > New access token |

**Importante:** Nunca commitar valores reais de secrets no repositorio. Usar apenas via GitHub Secrets.

## Branch protection

Configurar em **Settings > Branches > Branch protection rules** para a branch `main`:

1. Clicar em **Add rule**
2. Em **Branch name pattern**: digitar `main`
3. Marcar **Require a pull request before merging**
4. Marcar **Require status checks to pass before merging**
5. Em **Status checks that are required**: buscar e selecionar o job `ci`
6. Marcar **Require branches to be up to date before merging**
7. Clicar **Save changes**

Apos configurar, nenhum merge direto na `main` sera possivel sem o CI passar.

## Workflows

### CI (`.github/workflows/ci.yml`)

- **Trigger:** Pull requests para `main`
- **Steps:** checkout > setup-node > npm ci > lint > build > test
- **Objetivo:** Garantir que nenhum PR quebra o build, lint ou testes

### Deploy Staging (`.github/workflows/deploy-staging.yml`)

- **Trigger:** Push na `main` (apos merge de PR)
- **Steps:** checkout > setup-node > npm ci > build > deploy Netlify
- **Objetivo:** Deploy automatico para staging apos cada merge

## Como adicionar deploy de producao

Para habilitar deploy de producao com aprovacao manual:

1. Editar `.github/workflows/deploy-staging.yml`
2. Adicionar `environment: production` no job `deploy`
3. Adicionar `--prod` flag no step de deploy Netlify:
   ```yaml
   args: deploy --dir=frontend/dist --site=${{ secrets.NETLIFY_SITE_ID }} --auth=${{ secrets.NETLIFY_AUTH_TOKEN }} --prod
   ```
4. Configurar environment de aprovacao em **Settings > Environments > New environment > production**
5. Adicionar revisores obrigatorios no environment para aprovacao manual antes do deploy

## Edge Functions

O deploy de Edge Functions do Supabase nao esta incluido no CI/CD automatizado. Para deploy manual:

```bash
supabase functions deploy nome-da-funcao
# Para funcoes sem JWT (webhooks): adicionar --no-verify-jwt
supabase functions deploy asaas-webhook --no-verify-jwt
```
