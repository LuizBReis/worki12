# Worki - Marketplace de Freelancers

Plataforma que conecta empresas a trabalhadores freelancers no mercado brasileiro.

## Stack

- **Frontend:** React 19 + Vite + TypeScript + TailwindCSS
- **Backend:** Supabase Edge Functions (Deno)
- **Database:** Supabase PostgreSQL com RLS
- **Pagamentos:** Asaas (PIX, wallet central)
- **Auth:** Supabase Auth
- **Realtime:** Supabase Realtime (mensagens, notificacoes)

## Setup

```bash
# 1. Clone e instale
cd frontend
cp .env.example .env  # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm install

# 2. Dev server
npm run dev  # http://localhost:5173

# 3. Build de producao
npm run build

# 4. Testes
npm run test
```

## Estrutura

```
frontend/src/
  pages/           # Paginas (worker/, company/, shared)
  components/      # Componentes reutilizaveis
  contexts/        # Auth, Notification, Toast
  hooks/           # useJobApplication, use-mobile
  services/        # walletService, analytics, api
  lib/             # supabase client, gamification
  types/           # Interfaces TypeScript centralizadas

supabase/
  functions/       # Edge Functions (Deno)
    asaas-deposit/     # Gerar cobranca PIX
    asaas-withdraw/    # Saque via PIX
    asaas-checkout/    # Liberar escrow para worker
    asaas-sync/        # Sync manual de depositos
    asaas-webhook/     # Webhook de pagamentos
    jobs-api/          # CRUD de vagas
    applications-api/  # CRUD de candidaturas
    profiles-api/      # CRUD de perfis
    _shared/asaas.ts   # Client Asaas compartilhado
  migrations/      # SQL migrations
```

## Fluxo de Pagamento

```
Empresa deposita via PIX → Saldo na wallet central
    ↓
Empresa cria vaga → Escrow reservado (atomico)
    ↓
Worker contratado → Check-in/Check-out bidirecional
    ↓
Empresa finaliza → Escrow liberado para worker (atomico)
    ↓
Worker saca via PIX → Taxa 5% da plataforma
```

## Edge Functions (Asaas)

| Funcao | Metodo | Descricao |
|--------|--------|-----------|
| `asaas-deposit` | POST | Cria cobranca PIX no master account. Body: `{ amount, name?, cpfCnpj? }` |
| `asaas-withdraw` | POST | Transfere via PIX para worker. Body: `{ amount, pixKey, pixKeyType }` |
| `asaas-checkout` | POST | Libera escrow para worker. Body: `{ jobId, workerId }` |
| `asaas-sync` | POST | Sincroniza depositos pendentes do Asaas. Body: `{}` |
| `asaas-webhook` | POST | Recebe webhooks Asaas (IP whitelist + token). Body: evento Asaas |

Auth: todas exigem `Authorization: Bearer <jwt>` (exceto webhook que usa IP + token).

## Database Schema

### Tabelas principais

| Tabela | Descricao |
|--------|-----------|
| `workers` | Perfis de trabalhadores |
| `companies` | Perfis de empresas |
| `jobs` | Vagas (status: open, paused, deleted) |
| `applications` | Candidaturas (pending → interview → hired → in_progress → completed) |
| `wallets` | Carteiras (balance, user_type) |
| `escrow_transactions` | Escrow (reserved → released / refunded) |
| `wallet_transactions` | Log de transacoes |
| `Conversation` | Conversas entre worker e empresa |
| `messages` | Mensagens de chat |
| `notifications` | Notificacoes do sistema |
| `reviews` | Avaliacoes pos-job |
| `analytics_events` | Eventos de analytics |

### RPCs atomicas

| Funcao | Descricao |
|--------|-----------|
| `reserve_escrow` | Reserva escrow com lock FOR UPDATE |
| `release_escrow` | Libera escrow para worker |
| `refund_escrow` | Reembolsa escrow para empresa |
| `credit_deposit` | Credita deposito com dedup por reference_id |
| `update_wallet_balance` | Incremento/decremento atomico |

### Seguranca

- RLS habilitado em todas as tabelas
- CHECK constraint `balance >= 0` previne saldo negativo
- UNIQUE partial index previne escrow duplicado por vaga
- Webhook Asaas validado por IP whitelist + token
- Service role key nunca exposta no frontend

## Env Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Edge Functions (Supabase Secrets)
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ASAAS_API_KEY
ASAAS_ENVIRONMENT=sandbox|production
ASAAS_WEBHOOK_TOKEN
```

## Deploy

Frontend configurado para Vercel (`vercel.json` com SPA rewrites).

```bash
cd frontend && npm run build
# Output: frontend/dist/
```
