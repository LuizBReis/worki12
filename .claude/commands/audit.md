Run a comprehensive MVP Readiness Audit on the entire Worki codebase.

This is Agent 0 — the first agent you should run before launch. It answers: "What don't we know that we don't know?"

Use the **mvp-auditor** subagent with model **opus**.

The auditor will:
1. Scan every file, route, endpoint, model, and migration in the codebase
2. Audit across 8 dimensions: Core Features, Auth, Data, Error Handling, Security, Infrastructure, UX, Testing
3. Produce `docs/audit/MVP-READINESS-AUDIT.md` with complete findings
4. Create prioritized GitHub Issues (P0-P3) for EVERY gap found — each with acceptance criteria and effort estimates
5. Add all new issues to the project board in `stage:backlog`

After it runs, the backlog is COMPLETE. Run `/project:run` to process all findings through the pipeline.

Board: https://github.com/orgs/Workifree/projects/1
