# Ralph Agent Configuration - Worki

## Build Instructions

```bash
# Build frontend (TypeScript check + Vite build)
cd frontend && npm run build

# Lint frontend
cd frontend && npm run lint
```

## Test Instructions

```bash
# Run frontend tests (when configured)
cd frontend && npm test

# Manual edge function test examples:
# Test jobs-api
curl -i -X GET "http://localhost:54321/functions/v1/jobs-api" \
  -H "Authorization: Bearer <anon-key>"

# Test asaas-deposit
curl -i -X POST "http://localhost:54321/functions/v1/asaas-deposit" \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "payment_method": "PIX"}'
```

## Run Instructions

```bash
# Start frontend dev server
cd frontend && npm run dev
# Runs on http://localhost:5173

# Start Supabase locally (requires Docker)
supabase start

# Serve edge functions locally
supabase functions serve

# Apply new migrations
supabase db push
```

## Environment Setup

### Frontend
```bash
cd frontend
cp .env.example .env
# Edit .env with your Supabase credentials
npm install
```

### Supabase Edge Functions
```bash
cd supabase
cp .env.example .env
# Edit .env with your Supabase + Asaas credentials
```

## Project Stack
- **Frontend:** React 19 + Vite + TypeScript + TailwindCSS
- **Backend:** Supabase Edge Functions (Deno)
- **Database:** Supabase PostgreSQL with RLS
- **Payments:** Asaas (BR, central wallet)
- **Auth:** Supabase Auth
- **Realtime:** Supabase Realtime (notifications, messages)

## Key Directories
- `frontend/src/pages/` - All page components
- `frontend/src/components/` - Reusable components
- `frontend/src/services/` - Business logic services
- `frontend/src/contexts/` - React contexts (Auth, Notifications, Toast)
- `frontend/src/hooks/` - Custom hooks
- `frontend/src/lib/` - Utilities and config
- `supabase/functions/` - Edge functions (Deno)
- `supabase/migrations/` - Database migrations

## Notes
- Always run `npm run build` in frontend/ before committing
- Edge functions use Deno, NOT Node.js - imports use URL/JSR format
- All commits should be in Portuguese (project convention)
- Update this file when build process changes
