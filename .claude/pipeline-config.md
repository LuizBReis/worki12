# Pipeline Config

GITHUB_OWNER=Workifree
GITHUB_REPO=worki12
GITHUB_PROJECT_NUMBER=1
GITHUB_PROJECT_URL=https://github.com/orgs/Workifree/projects/1
GITHUB_PROJECT_ID=PVT_kwDOD_VKnM4BRkwN

## Board Column Field (Status — built-in, drives board columns)
STATUS_FIELD_ID=PVTSSF_lADOD_VKnM4BRkwNzg_XOIo

## Status Option IDs (use these in move-stage.sh)
STATUS_BACKLOG=f75ad846
STATUS_SPEC_DONE=47fc9ee4
STATUS_SPRINT=98236657
STATUS_DEV=da9741af
STATUS_REVIEW=44c85ef2
STATUS_QA=372b4402
STATUS_SECURITY=f7064b23
STATUS_DONE=e7d385f5

## Custom Pipeline Stage Field (secondary — not used for board columns)
PIPELINE_STAGE_FIELD_ID=PVTSSF_lADOD_VKnM4BRkwNzg_XOQY
STAGE_BACKLOG=0188272b
STAGE_SPEC_DONE=4581d7a8
STAGE_SPRINT=92e688d7
STAGE_DEV=acc1f1d6
STAGE_REVIEW=24763a06
STAGE_QA=5a8a583e
STAGE_SECURITY=327d2a3e
STAGE_DONE=92d31d33

## Stage Labels (8 stages — agents read and write these)
| Label | Board Column | Status Option ID | move-stage.sh call |
|-------|-------------|------------------|--------------------|
| stage:backlog | BACKLOG | f75ad846 | bash .claude/move-stage.sh N "stage:X" "stage:backlog" "f75ad846" |
| stage:spec-done | SPEC-DONE | 47fc9ee4 | bash .claude/move-stage.sh N "stage:backlog" "stage:spec-done" "47fc9ee4" |
| stage:sprint | SPRINT | 98236657 | bash .claude/move-stage.sh N "stage:spec-done" "stage:sprint" "98236657" |
| stage:dev | DEV | da9741af | bash .claude/move-stage.sh N "stage:X" "stage:dev" "da9741af" |
| stage:review | REVIEW | 44c85ef2 | bash .claude/move-stage.sh N "stage:sprint" "stage:review" "44c85ef2" |
| stage:qa | QA | 372b4402 | bash .claude/move-stage.sh N "stage:review" "stage:qa" "372b4402" |
| stage:security | SECURITY | f7064b23 | bash .claude/move-stage.sh N "stage:qa" "stage:security" "f7064b23" |
| stage:done | DONE | e7d385f5 | bash .claude/move-stage.sh N "stage:security" "stage:done" "e7d385f5" |

## Rejection Labels (any agent can set these — add AFTER move-stage.sh)
| Label | Meaning |
|-------|---------|
| rejected:review | code-reviewer failed → back to dev |
| rejected:qa | qa-tester failed → back to dev |
| rejected:security | security-auditor failed → back to dev |
| needs-human | spec-agent needs clarification |
| blocked | external dependency blocking |

## Priority Labels
- P0-critical, P1-high, P2-medium, P3-low

## Type Labels
- type:feature, type:bugfix, type:tech-debt

## CRITICAL RULES (all agents must follow)

### 1. Board Sync is Mandatory
The GitHub Projects board MUST reflect the exact state of every issue at all times.
- ALWAYS use `bash .claude/move-stage.sh` for transitions — it updates BOTH label AND board
- NEVER update labels without also updating the board column
- move-stage.sh now removes ALL old stage: labels before adding new one (prevents duplicates)
- move-stage.sh now reopens closed issues (prevents disappearing from pipeline)

### 2. Never Use `Closes #N` in PR Body
Use `Refs #N` instead. GitHub auto-closes issues when PRs with `Closes` are merged.
This removes the issue from the pipeline before QA and Security can process it.
The pipeline controls issue lifecycle via labels and board — NOT via GitHub close/reopen.

### 3. Never Close Issues Manually
Issues progress through the pipeline via stage labels and board columns.
`gh issue close` is FORBIDDEN for all agents. Issues stay open until the pipeline completes.
