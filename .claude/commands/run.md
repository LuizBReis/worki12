Run the FULL autonomous pipeline from backlog to done in a LOOP until everything is complete.

**Read `docs/PIPELINE.md` first** for complete documentation of how the pipeline works.
**Read `.claude/pipeline-config.md`** for GitHub Projects IDs.

The pipeline runs in a loop: after each full pass, it checks if any items remain in DEV/REVIEW/QA/SECURITY. If yes, it runs another pass. It stops when all non-SPRINT stages are empty.

---

## Pass 1: Forward Pipeline

Run each agent in sequence. Each agent processes ALL items in its stage before the next starts.

### Step 1: Spec Agent
Read `.claude/agents/spec-agent.md` and follow instructions.
Process ALL `stage:backlog` issues → create specs → move to `stage:spec-done`.
Use `bash .claude/move-stage.sh` for transitions.
Wait for completion before next step.

### Step 2: Sprint Planner
Read `.claude/agents/sprint-planner.md` and follow instructions.
Process ALL `stage:spec-done` issues → create task issues → move to `stage:sprint`.
Wait for completion before next step.

### Step 3: Dev Agent
Read `.claude/agents/dev-agent.md` and follow instructions.
**FIRST:** Process rejected items in `stage:dev` with `rejected:*` labels.
**THEN:** Process ALL `stage:sprint` task issues → implement → PR → move to `stage:review`.
Use model **opus** for this agent.
Wait for completion before next step.

### Step 4: Code Reviewer
Read `.claude/agents/code-reviewer.md` and follow instructions.
Process ALL `stage:review` issues → APPROVE to `stage:qa` or REJECT to `stage:dev`.
Wait for completion before next step.

### Step 5: QA Tester
Read `.claude/agents/qa-tester.md` and follow instructions.
**CRITICAL:** Checkout the PR branch before testing each issue (`git checkout {branchName}`).
Process ALL `stage:qa` issues → SHIP to `stage:security` or BLOCK to `stage:dev`.
Wait for completion before next step.

### Step 6: Security Auditor
Read `.claude/agents/security-auditor.md` and follow instructions.
Process ALL `stage:security` issues → SHIP to `stage:done` (with git tag) or BLOCK to `stage:dev`.
Wait for completion before next step.

---

## Board Sync Check

After each agent completes, verify the board is synchronized:

```bash
# Quick audit
gh project item-list 1 --owner {ORG} --format json --limit 300 > /tmp/board.json
gh issue list --repo {ORG}/{REPO} --state open --json number,labels --limit 200 > /tmp/issues.json
# Compare and fix any mismatches
```

---

## Loop Check: Are We Done?

After Step 6, check if any items remain outside DONE and SPRINT:

```bash
gh issue list --repo {ORG}/{REPO} --label "stage:dev" --state open --json number --jq 'length'
gh issue list --repo {ORG}/{REPO} --label "stage:review" --state open --json number --jq 'length'
gh issue list --repo {ORG}/{REPO} --label "stage:qa" --state open --json number --jq 'length'
gh issue list --repo {ORG}/{REPO} --label "stage:security" --state open --json number --jq 'length'
```

**If ANY count > 0:** Go back to Step 3 (Dev Agent) and run another pass.
The dev-agent will pick up rejected items, fix them, and push them through the pipeline again.

**If ALL counts = 0:** Pipeline is complete. Print final report.

---

## Merge Pass (after pipeline is complete)

When all task issues are in DONE, merge PRs to main:

```bash
# List open PRs
gh pr list --repo {ORG}/{REPO} --state open --json number,headRefName,mergeable

# Merge each in dependency order (T1 before T2)
gh pr merge {N} --repo {ORG}/{REPO} --squash --delete-branch

# If conflicts: rebase then merge
git checkout {branch} && git rebase origin/main
git push origin {branch} --force-with-lease
gh pr merge {N} --squash --delete-branch
```

---

## Final Report

```
## Pipeline Run — Completo

| Stage | Processados | Aprovados | Rejeitados |
|-------|-------------|-----------|------------|
| spec-agent | N | N | N (needs-human) |
| sprint-planner | N specs | N tasks criados | — |
| dev-agent | N tasks | N PRs abertos | N rejected fixes |
| code-reviewer | N PRs | N APPROVE | N REQUEST CHANGES |
| qa-tester | N | N SHIP | N BLOCK |
| security-auditor | N | N SHIP | N BLOCK |
| **Loop passes** | N | | |

## Board Final
BACKLOG: 0 | SPEC-DONE: 0 | SPRINT: N (parents) | DEV: 0 | REVIEW: 0 | QA: 0 | SECURITY: 0 | DONE: N

## PRs Mergeados
{list}

Board: https://github.com/orgs/{ORG}/projects/1
```
