#!/bin/bash
#
# PR을 표준 형식으로 생성한다. 제목 넘버링과 리뷰어 지정은 자동이다.
#
# Usage:
#   ./pr.sh <type> "<title>" "<작업 내용>" --scope <SCOPE> [옵션]
#   ./pr.sh <type> "<title>" -f <본문파일>        # 본문 전체를 파일로 넘길 때
#
# --scope 는 필수다. 작업이 어느 영역인지 제목에 박아 리뷰할 때 맥락을 먼저 준다.
#   FE/Component  FE/Page  FE/Style  FE/State  FE/A11y
#   BE/API        BE/Data  BE/Auth   BE/Payment
#   Infra/Build   Infra/CI Infra/Deploy  Infra/Repo
#   Docs/Brand    Docs/Plan
#
# 옵션:
#   --changes  "<바꾼 것>"      개발자가 읽는 칸. 줄바꿈은 \n 으로.
#   --review   "<봐주세요>"     리뷰어 판단이 필요한 곳. 없으면 생략(자동으로 "특별히 없음")
#   --screen   "<화면>"         스크린샷 설명. 생략하면 "화면 변화 없음"
#   --roadmap  "<M0 · I0.1>"    로드맵 위치. 생략하면 줄 자체가 빠진다
#   --issue    "<번호>"         close 할 이슈. 생략하면 줄 자체가 빠진다
#   --no-reviewer               리뷰어를 지정하지 않는다 (기본은 자동 지정)
#   --dry-run                   PR을 만들지 않고 제목·본문만 출력한다
#
# 예)
#   ./pr.sh feat "상품 목록 페이지" "상품을 목록으로 볼 수 있게 했습니다." \
#     --changes "- ProductList component 추가\n- /products route 추가" \
#     --review "카드 간격이 브랜드 문서 5-8절 여백 규칙에 맞는지" \
#     --roadmap "M2 · I2.3"
#
# <type>: feat | fix | refactor | chore | assets | style | docs | test
# 제목 형식: [<이모지> <라벨>/<자동번호>] <title>

set -e

# 이 프로젝트는 2인 작업이고 main은 승인 1개가 필요하다.
# PR을 열면서 리뷰어를 지정해야 Slack에 "리뷰 요청" 알림이 나간다.
DEFAULT_REVIEWER="jerryko570"

TYPE=$1
TITLE=$2
shift 2 2>/dev/null || true

DESCRIPTION=""
BODY_FILE=""
CHANGES=""
REVIEW=""
SCREEN=""
ROADMAP=""
CLOSE_ISSUE=""
ASSIGN_REVIEWER=true
DRY_RUN=false
SCOPE=""

# 세 번째 인자가 옵션이 아니면 작업 내용으로 받는다.
if [ -n "$1" ] && [ "${1#-}" = "$1" ]; then
  DESCRIPTION=$1
  shift
fi

while [ $# -gt 0 ]; do
  case "$1" in
    -f)            BODY_FILE=$2; shift 2 ;;
    --changes)     CHANGES=$2; shift 2 ;;
    --review)      REVIEW=$2; shift 2 ;;
    --screen)      SCREEN=$2; shift 2 ;;
    --scope)       SCOPE=$2; shift 2 ;;
    --roadmap)     ROADMAP=$2; shift 2 ;;
    --issue)       CLOSE_ISSUE=$2; shift 2 ;;
    --no-reviewer) ASSIGN_REVIEWER=false; shift ;;
    --dry-run)     DRY_RUN=true; shift ;;
    *) echo "알 수 없는 옵션: $1"; exit 1 ;;
  esac
done

VALID_SCOPES="FE/Component FE/Page FE/Style FE/State FE/A11y BE/API BE/Data BE/Auth BE/Payment Infra/Build Infra/CI Infra/Deploy Infra/Repo Docs/Brand Docs/Plan"

if [ -n "$SCOPE" ]; then
  case " $VALID_SCOPES " in
    *" $SCOPE "*) ;;
    *)
      echo "알 수 없는 scope: $SCOPE"
      echo "쓸 수 있는 값:"
      for v in $VALID_SCOPES; do echo "  $v"; done
      exit 1 ;;
  esac
fi

if [ -z "$TYPE" ] || [ -z "$TITLE" ] || [ -z "$SCOPE" ]; then
  echo "사용법: ./pr.sh <type> \"<title>\" \"<작업 내용>\" --scope <SCOPE> [--changes ...] [--review ...] [--screen ...] [--roadmap ...] [--issue ...]"
  echo "       ./pr.sh <type> \"<title>\" -f <본문파일>"
  echo "  type:  feat | fix | refactor | chore | assets | style | docs | test"
  echo "  scope: $VALID_SCOPES" | tr " " "
" | sed "s/^  scope:/  scope:/"
  exit 1
fi

# Type → 이모지/라벨 매핑 (commitlint.config.js의 type-enum과 같이 유지할 것)
case "$TYPE" in
  feat)     EMOJI="✨"; LABEL="Feature" ;;
  fix)      EMOJI="🐛"; LABEL="Fix" ;;
  refactor) EMOJI="♻️"; LABEL="Refactor" ;;
  chore)    EMOJI="⚙️"; LABEL="Chore" ;;
  assets)   EMOJI="🖼️"; LABEL="Assets" ;;
  style)    EMOJI="🎨"; LABEL="Style" ;;
  docs)     EMOJI="📝"; LABEL="Docs" ;;
  test)     EMOJI="🧪"; LABEL="Test" ;;
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

PR_TITLE="[${EMOJI} ${LABEL}/${NUM}][${SCOPE}] ${TITLE}"

if [ -n "$BODY_FILE" ]; then
  if [ ! -f "$BODY_FILE" ]; then
    echo "본문 파일을 찾을 수 없습니다: $BODY_FILE"
    exit 1
  fi
  PR_BODY=$(cat "$BODY_FILE")
else
  [ -z "$DESCRIPTION" ] && DESCRIPTION="$TITLE"
  [ -z "$REVIEW" ] && REVIEW="특별히 없음"
  [ -z "$SCREEN" ] && SCREEN="화면 변화 없음"

  # \n 을 실제 줄바꿈으로 편다 (--changes 를 여러 줄로 넘기기 위함)
  CHANGES=$(printf '%b' "$CHANGES")

  PR_BODY=""
  [ -n "$ROADMAP" ] && PR_BODY="> 🗺️ ${ROADMAP}

"
  PR_BODY="${PR_BODY}## 📋 작업 내용
${DESCRIPTION}
"
  [ -n "$CHANGES" ] && PR_BODY="${PR_BODY}
## 🔧 바꾼 것
${CHANGES}
"
  PR_BODY="${PR_BODY}
## 👀 봐주세요
${REVIEW}

## 🖼️ 화면
${SCREEN}
"
  [ -n "$CLOSE_ISSUE" ] && PR_BODY="${PR_BODY}
close #${CLOSE_ISSUE}
"
fi

GH_LABEL="${EMOJI}${LABEL}"

ARGS=(--title "${PR_TITLE}" --body "${PR_BODY}" --assignee "@me" --label "${GH_LABEL}")
if [ "$ASSIGN_REVIEWER" = "true" ]; then
  ARGS+=(--reviewer "${DEFAULT_REVIEWER}")
fi

if [ "$DRY_RUN" = "true" ]; then
  echo "--- 제목 ---"
  echo "${PR_TITLE}"
  echo "--- 본문 ---"
  echo "${PR_BODY}"
  echo "--- 라벨: ${GH_LABEL} / 리뷰어: $([ "$ASSIGN_REVIEWER" = true ] && echo "$DEFAULT_REVIEWER" || echo "없음") ---"
  exit 0
fi

gh pr create "${ARGS[@]}"
