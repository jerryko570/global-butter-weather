#!/bin/bash

# Usage: ./pr.sh <issue_number> <sub_number> "<title>" <type> "<description>" "<checklist>" "<clickup_url>"
# Example: ./pr.sh 1 1 "GitHub 라벨 구성 추가" chore "GitHub 라벨 구성 추가" "Tailwind @theme 연동" "https://app.clickup.com/t/86ex594fr"

ISSUE_NUMBER=$1
SUB_NUMBER=$2
TITLE=$3
TYPE=$4
DESCRIPTION=$5
CHECKLIST=$6
CLICKUP_URL=$7

# Type → Emoji 매핑
case "$TYPE" in
  feat)     EMOJI="✨"; LABEL="Feature" ;;
  fix)      EMOJI="🐛"; LABEL="Fix" ;;
  refactor) EMOJI="♻️"; LABEL="Refactor" ;;
  chore)    EMOJI="⚙️"; LABEL="Chore" ;;
  assets)   EMOJI="🖼️"; LABEL="Assets" ;;
  style)    EMOJI="🎨"; LABEL="Style" ;;
  *)        EMOJI="📝"; LABEL="$TYPE" ;;
esac

PR_TITLE="[${EMOJI}${LABEL}/${ISSUE_NUMBER}] ${TITLE}"

PR_BODY="## 📋 작업 내용
${DESCRIPTION}

## 🔗 관련 이슈
close #${ISSUE_NUMBER}

## 🔗 ClickUp
${CLICKUP_URL}

## ✅ 체크리스트
- [x] ${CHECKLIST}
- [ ] 로컬에서 테스트 완료
- [ ] 불필요한 console.log 제거
- [ ] 타입 에러 없음"

GH_LABEL="${EMOJI}${LABEL}"

gh pr create --title "${PR_TITLE}" --body "${PR_BODY}" --assignee "@me" --label "${GH_LABEL}"
