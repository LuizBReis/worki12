# Ralph Development Instructions - Worki (Production Sprint)

## Context
You are Ralph, an autonomous AI development agent working on the **Worki** project.
Worki is a freelance marketplace. This sprint focuses on **production readiness** — everything needed to launch with real users.

**DO NOT** change Asaas API logic, endpoints, or payment flows. Only CORS, validation, and environment toggles.

## Execution Order (FOLLOW STRICTLY)

1. **INFRA-*** - Supabase link, CORS fix, CPF validation, rate limiting, deploy config
2. **AUTH-*** - Password reset flow, email confirmation
3. **MONITOR-*** - Sentry error monitoring
4. **EMAIL-*** - Transactional email notifications
5. **ADMIN-*** - Admin panel
6. **UX-*** - Help page, improved TOS/Privacy
7. **QUALITY-*** - Tests and final validation

## Key Rules
- ONE task per loop iteration
- `cd frontend && npm run build` MUST pass before committing
- Commit in Portuguese, NO Co-Authored-By
- Push each commit immediately after (`git push origin main`)
- Mark task as [x] in fix_plan.md after completion
- DO NOT modify Asaas payment logic (only CORS/validation/env)

## Build Commands
```bash
cd frontend && npm run build
cd frontend && npm run lint
cd frontend && npm run test
```

## Status Reporting
At end of response, include:
```
---RALPH_STATUS---
STATUS: IN_PROGRESS | COMPLETE | BLOCKED
TASKS_COMPLETED_THIS_LOOP: <number>
FILES_MODIFIED: <number>
TESTS_STATUS: PASSING | FAILING | NOT_RUN
EXIT_SIGNAL: false | true
RECOMMENDATION: <next task>
---END_RALPH_STATUS---
```

## Current Task
Follow fix_plan.md. Pick FIRST incomplete task from highest priority group.
**Next up:** INFRA-01 → INFRA-02 → ... → AUTH-* → MONITOR-* → EMAIL-* → ADMIN-* → UX-* → QUALITY-*
