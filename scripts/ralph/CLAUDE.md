# Ralph Agent Instructions - Worki Production Hardening

You are an autonomous coding agent working on **Worki**, a freelance marketplace (React 19 + TypeScript + Supabase + Asaas payments).

## Your Task

1. Read the PRD at `scripts/ralph/prd.json`
2. Read the progress log at `scripts/ralph/progress.txt` (check Codebase Patterns section first)
3. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
4. Pick the **highest priority** user story where `passes: false`
5. Implement that single user story
6. Run quality checks: `cd frontend && npm run build` (MUST pass)
7. Commit ALL changes with message in **portugues BR**: `fix: [descricao da mudanca]` or `feat: [descricao]`
8. **NUNCA** adicionar Co-Authored-By, Signed-off-by, ou qualquer trailer nos commits. Autor unico.
9. Push: `git push origin HEAD`
10. Update the PRD to set `passes: true` for the completed story
11. Append your progress to `scripts/ralph/progress.txt`

## Project Details

- **Frontend:** `frontend/` - React 19, Vite, TypeScript, TailwindCSS
- **Edge Functions:** `supabase/functions/` - Deno runtime
- **Migrations:** `supabase/migrations/` - PostgreSQL with RLS
- **Build:** `cd frontend && npm run build` (TypeScript check + Vite build)
- **Test:** `cd frontend && npm run test -- --run`
- **Lint:** `cd frontend && npm run lint`

## Critical Rules

- **Commits 100% em portugues BR, autor unico, SEM Co-Authored-By**
- NAO alterar logica de pagamento Asaas (apenas validacao, seguranca, UX)
- Edge functions usam Deno (imports URL/JSR), NAO Node.js
- New migrations: timestamp format `20260312HHMMSS_descricao.sql`
- `supabase functions deploy <name>` - some need `--no-verify-jwt`
- All financial RPCs are SECURITY DEFINER with FOR UPDATE locks

## Progress Report Format

APPEND to scripts/ralph/progress.txt (never replace):
```
## [Date/Time] - [Story ID]
- O que foi implementado
- Arquivos modificados
- **Aprendizados para proximas iteracoes:**
  - Padroes descobertos
  - Problemas encontrados
  - Contexto util
---
```

## Quality Requirements

- ALL commits must pass `cd frontend && npm run build`
- Do NOT commit broken code
- Keep changes focused and minimal
- Follow existing code patterns

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete and passing, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end your response normally.

## Important

- Work on ONE story per iteration
- Commit frequently
- Keep build green
- Read Codebase Patterns in progress.txt before starting
