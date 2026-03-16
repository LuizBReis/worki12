# Configuracao do Ambiente de Testes E2E

> **NUNCA executar o seed contra banco de producao.**

## Pre-requisitos

- Node 20+
- Supabase CLI (`npm install -g supabase`)
- Docker rodando

## Passo a passo

### 1. Iniciar Supabase local

```bash
supabase start
```

Anote a `anon key` e `service_role key` do output.

### 2. Criar usuarios de teste

Acesse o Supabase Studio local em `http://localhost:54323`.

Va em **Authentication > Users > Create user** e crie:

| Email | Senha | user_metadata |
|---|---|---|
| `e2e_worker@test.worki.com` | `TestWorker123!` | `{"user_type": "work"}` |
| `e2e_company@test.worki.com` | `TestCompany123!` | `{"user_type": "hire"}` |

### 3. Aplicar seed SQL

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -f frontend/e2e/fixtures/seed.sql
```

### 4. Configurar variaveis de ambiente

Crie `frontend/.env.test` com:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<chave anon do passo 1>
```

### 5. Instalar navegadores do Playwright

```bash
cd frontend && npx playwright install --with-deps chromium
```

### 6. Rodar testes E2E

```bash
cd frontend && npm run test:e2e
```

Para rodar com interface grafica:

```bash
cd frontend && npm run test:e2e:ui
```
