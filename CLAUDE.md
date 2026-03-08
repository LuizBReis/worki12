# Worki - Claude Code Project Instructions

## Project Overview
Worki is a freelance marketplace platform (React 19 + TypeScript + Supabase + Asaas/Stripe payments).

## Stack
- **Frontend:** React 19, Vite, TypeScript, TailwindCSS, React Router DOM v7, TanStack React Query
- **Backend:** Supabase Edge Functions (Deno runtime)
- **Database:** Supabase PostgreSQL with RLS
- **Payments:** Asaas (Brazilian market) + Stripe
- **Auth:** Supabase Auth

## Build Commands
```bash
cd frontend && npm run build   # TypeScript check + Vite build (MUST pass)
cd frontend && npm run lint    # ESLint check
cd frontend && npm run dev     # Dev server on :5173
```

## Key Rules
- All commits in Portuguese
- Never expose service_role keys in frontend code
- All edge functions must handle CORS preflight (OPTIONS)
- Use Supabase RLS for data access control
- TypeScript strict mode - avoid `any` types
- Follow existing code patterns before introducing new ones

## Directory Structure
```
frontend/src/pages/          # Route pages
frontend/src/components/     # Reusable components
frontend/src/contexts/       # Auth, Notification, Toast contexts
frontend/src/hooks/          # Custom hooks
frontend/src/services/       # Business logic (walletService, analytics)
frontend/src/lib/            # Config (supabase client, gamification)
supabase/functions/          # Deno edge functions
supabase/functions/_shared/  # Shared utils (asaas.ts, stripe.ts)
supabase/migrations/         # SQL migrations
```

## Ralph Integration
This project uses Ralph for autonomous development loops.
- Config: `.ralphrc`
- Tasks: `.ralph/fix_plan.md`
- Instructions: `.ralph/PROMPT.md`
- Build info: `.ralph/AGENT.md`
