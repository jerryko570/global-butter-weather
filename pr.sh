#!/bin/bash
#
# PR을 표준 형식으로 생성한다. 제목 넘버링은 자동으로 매겨진다.
#
# Usage:  ./pr.sh <type> "<title>" ["<description>"] ["<close_issue_number>"]
# 예)     ./pr.sh feat "상품 목록 페이지"
#         ./pr.sh chore "설정 정리" "husky/eslint 정리" 12
#
# <type>: feat | fix | refactor | chore | assets | style | docs
# 제목 형식: [<이모지> <라벨>/<자동번호>] <title>
#   예)      [✨ Feature/5] 상품 목록 페이지

set -e

TYPE=$1
TITLE=$2
DESCRIPTION=${3:-$TITLE}
CLOSE_ISSUE=$4

if [ -z "$TYPE" ] || [ -z "$TITLE" ]; then
  echo "사용법: ./pr.sh <type> \"<title>\" [\"<description>\"] [close_issue_number]"
  echo "  type: feat | fix | refactor | chore | assets | style | docs"
  exit 1
fi

# Type → 이모지/라벨 매핑
case "$TYPE" in
  feat)     EMOJI="✨"; LABEL="Feature" ;;
  fix)      EMOJI="🐛"; LABEL="Fix" ;;
  refactor) EMOJI="♻️"; LABEL="Refactor" ;;
  chore)    EMOJI="⚙️"; LABEL="Chore" ;;
  assets)   EMOJI="🖼️"; LABEL="Assets" ;;
  style)    EMOJI="🎨"; LABEL="Style" ;;
  docs)     EMOJI="📝"; LABEL="Docs" ;;
  *)        EMOJI="📝"; LABEL="$TYPE" ;;
esac

# 다음 번호 자동 계산 (GitHub은 issue·PR 번호를 공유 → 둘 중 최댓값 + 1)
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
LAST_ISSUE=$(gh issue list -R "$REPO" --state all --limit 1 --json number -q '.[0].number // 0')
LAST_PR=$(gh pr list -R "$REPO" --state all --limit 1 --json number -q '.[0].number // 0')
if [ "$LAST_ISSUE" -ge "$LAST_PR" ]; then
  NUM=$((LAST_ISSUE + 1))
else
  NUM=$((LAST_PR + 1))
fi

PR_TITLE="[${EMOJI} ${LABEL}/${NUM}] ${TITLE}"

# 관련 이슈 섹션 (이슈 번호를 넘겼을 때만 close 링크)
if [ -n "$CLOSE_ISSUE" ]; then
  ISSUE_SECTION="close #${CLOSE_ISSUE}"
else
  ISSUE_SECTION="_(관련 이슈 없음)_"
fi

PR_BODY="## 📋 작업 내용
${DESCRIPTION}

## 🔗 관련 이슈
${ISSUE_SECTION}

## ✅ 체크리스트
- [ ] 로컬에서 테스트 완료
- [ ] 불필요한 console.log 제거
- [ ] 타입 에러 없음"

GH_LABEL="${EMOJI}${LABEL}"

gh pr create --title "${PR_TITLE}" --body "${PR_BODY}" --assignee "@me" --label "${GH_LABEL}"
