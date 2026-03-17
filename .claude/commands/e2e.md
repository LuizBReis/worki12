Run the E2E Runner agent — a real-user testing agent that navigates the entire Worki app via Playwright.

Read `.claude/agents/e2e-runner.md` for FULL instructions — follow them EXACTLY.

Use model **opus** for maximum thoroughness.

The agent will:
1. Open a real browser via Playwright
2. Login as both Worker and Company test users
3. Navigate EVERY route, click EVERY button, fill EVERY form
4. Capture browser console logs, network errors, and edge function logs
5. Take screenshots of every page and every failure
6. Create GitHub Issues for each broken flow with full diagnostic context
7. Add all issues to `stage:backlog` on the project board
8. Produce `docs/e2e/E2E-RUN-REPORT.md` with complete results

**Pre-requisites:**
- Frontend dev server running: `cd frontend && npm run dev`
- Supabase accessible (local or remote)
- Test users created (see `docs/e2e-setup.md`)
- Playwright installed: `npx playwright install chromium`

**After it runs:** Use `/project:run` to process all bugs through the pipeline.

Board: https://github.com/orgs/Workifree/projects/1
