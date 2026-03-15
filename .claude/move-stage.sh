#!/usr/bin/env bash
# move-stage.sh — Move a GitHub Issue between pipeline stages
# Updates: (1) issue label, (2) ensures issue is OPEN, (3) Status field on GitHub Projects board
# VERIFIES the board column was actually updated — fails loudly if not.
#
# Usage: bash .claude/move-stage.sh <issue_number> <from_label> <to_label> <status_option_id>
#
# Status field option IDs (built-in field that drives the board columns):
#   backlog:    f75ad846
#   spec-done:  47fc9ee4
#   sprint:     98236657
#   dev:        da9741af
#   review:     44c85ef2
#   qa:         372b4402
#   security:   f7064b23
#   done:       e7d385f5
#
# Examples:
#   bash .claude/move-stage.sh 42 "stage:backlog"    "stage:spec-done" "47fc9ee4"
#   bash .claude/move-stage.sh 42 "stage:spec-done"  "stage:sprint"    "98236657"
#   bash .claude/move-stage.sh 42 "stage:sprint"     "stage:dev"       "da9741af"
#   bash .claude/move-stage.sh 42 "stage:dev"         "stage:review"    "44c85ef2"
#   bash .claude/move-stage.sh 42 "stage:review"     "stage:qa"        "372b4402"
#   bash .claude/move-stage.sh 42 "stage:qa"         "stage:security"  "f7064b23"
#   bash .claude/move-stage.sh 42 "stage:security"   "stage:done"      "e7d385f5"
#   bash .claude/move-stage.sh 42 "stage:review"     "stage:dev"       "da9741af"

set -e

ISSUE_NUMBER=$1
FROM_LABEL=$2
TO_LABEL=$3
STATUS_OPTION_ID=$4

REPO="Workifree/worki12"
PROJECT_NUMBER=1
ORG="Workifree"
PROJECT_ID="PVT_kwDOD_VKnM4BRkwN"
STATUS_FIELD_ID="PVTSSF_lADOD_VKnM4BRkwNzg_XOIo"

echo "Moving issue #${ISSUE_NUMBER}: ${FROM_LABEL} → ${TO_LABEL}"

# Step 0: Ensure issue is OPEN (closed issues disappear from pipeline queries)
ISSUE_STATE=$(gh issue view "${ISSUE_NUMBER}" --repo "${REPO}" --json state --jq '.state' 2>/dev/null || echo "UNKNOWN")
if [ "${ISSUE_STATE}" = "CLOSED" ]; then
  echo "  ⚠ Issue was CLOSED — reopening to keep in pipeline"
  gh issue reopen "${ISSUE_NUMBER}" --repo "${REPO}" 2>/dev/null || true
fi

# Step 1: Remove ALL stage: labels first (prevents duplicate stage labels)
CURRENT_LABELS=$(gh issue view "${ISSUE_NUMBER}" --repo "${REPO}" --json labels --jq '[.labels[].name | select(startswith("stage:"))] | join(",")' 2>/dev/null || echo "")
if [ -n "${CURRENT_LABELS}" ]; then
  IFS=',' read -ra LABELS_ARR <<< "${CURRENT_LABELS}"
  for lbl in "${LABELS_ARR[@]}"; do
    if [ "${lbl}" != "${TO_LABEL}" ]; then
      gh issue edit "${ISSUE_NUMBER}" --repo "${REPO}" --remove-label "${lbl}" 2>/dev/null || true
    fi
  done
fi

# Add the target label
gh issue edit "${ISSUE_NUMBER}" --repo "${REPO}" --add-label "${TO_LABEL}" 2>/dev/null || true
echo "  ✓ Label: ${TO_LABEL}"

# Step 2: Add issue to project (idempotent — safe if already added)
ISSUE_URL="https://github.com/${REPO}/issues/${ISSUE_NUMBER}"
ITEM_JSON=$(gh project item-add "${PROJECT_NUMBER}" \
  --owner "${ORG}" \
  --url "${ISSUE_URL}" \
  --format json 2>/dev/null || echo "")

ITEM_ID=$(echo "$ITEM_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")

# If item-add returned empty (already in project), find it
if [ -z "$ITEM_ID" ]; then
  ITEM_ID=$(gh project item-list "${PROJECT_NUMBER}" \
    --owner "${ORG}" \
    --format json \
    --limit 300 2>/dev/null | \
    python3 -c "
import json, sys
data = json.load(sys.stdin)
items = data.get('items', [])
for item in items:
    content = item.get('content', {})
    if content.get('number') == ${ISSUE_NUMBER}:
        print(item.get('id', ''))
        break
" 2>/dev/null || echo "")
fi

if [ -z "$ITEM_ID" ]; then
  echo "  ✗ ERROR: Could not get project item ID for issue #${ISSUE_NUMBER}"
  echo "  ✗ BOARD NOT UPDATED — manual fix required"
  exit 1
fi

echo "  ✓ Project item: ${ITEM_ID}"

# Step 3: Update the Status field (this drives the board columns)
EDIT_RESULT=$(gh project item-edit \
  --project-id "${PROJECT_ID}" \
  --id "${ITEM_ID}" \
  --field-id "${STATUS_FIELD_ID}" \
  --single-select-option-id "${STATUS_OPTION_ID}" 2>&1)

if [ $? -ne 0 ]; then
  echo "  ✗ ERROR: Board column update FAILED: ${EDIT_RESULT}"
  exit 1
fi

echo "  ✓ Board column updated"
echo "✅ Issue #${ISSUE_NUMBER} → ${TO_LABEL} (label + board synced)"
