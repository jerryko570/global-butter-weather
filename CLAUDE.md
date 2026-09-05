# global-butter-weather — 프로젝트 컨텍스트

Claude Code가 매 작업마다 참고하는 기준 문서. **코드가 바뀌면 이 문서도 같이 갱신할 것.**

> 이 파일은 2026-08-19에 이 레포 실측 기준으로 새로 작성됐다.
> 옛 레포(`butter-weather-shop`)에서 딸려온 문서는 PR #3에서 전부 제거됐다.
> 여기 없는 내용을 옛 대화 로그나 옛 문서에서 끌어와 쓰지 말 것 — 이 레포에서 확인된 것만 적는다.

## 1. 무엇을 만드는가

**이나래의 감각(판단)을 파는 브랜드**, 버터웨더. 더 짧게 — **버터웨더는 곧 이나래다.** 고객이 사는 이유는 물건의 기능이 아니라 "이게 왜 이래야 하는지"에 동의하기 때문이다.

브랜드·이름·기존 작업물 모두 이나래가 만든 것이고, 이번 작업은 그것을 버리는 리부트가 아니라 **기존의 감각을 살려 다시 시작하는 것**이다. 역할은 **이나래 = 감각**(무엇이 좋은지 정하지만 실체화는 못한다. 무엇을 드러낼지조차 그렇다), **홍설아 = 그것을 실체로 만드는 쪽**(기술적 구현과 정돈)으로 나뉜다.

**홍설아의 확인은 이나래의 확인으로 취급한다.** 두 사람은 늘 붙어서 대화하며 만들고 있다. 브랜드 판단을 물을 때 따로 승인을 기다리지 않는다.

- **직접 제작**이 현재 형태다. 확장 시 골라오는(편집) 방식이 붙을 수 있으나 시점·형태 모두 미정.
- **국내/해외로 시장을 나누지 않는다.** 지역별 사이트가 아니라 하나의 카탈로그에 언어·통화·배송이 옵션으로 붙는 구조.
- **매체는 브랜드의 정의가 아니다.** 파는 것은 이나래이지 특정 소재가 아니다. 비즈는 2025년에 이미 해봤고, 그때 계정이 비즈에 집중돼 보이는 것은 당시 상태일 뿐이다.
- 이름은 확장을 염두에 두고 넓게 지어졌다 — butter는 **따뜻한 느낌을 치환한 개념**, weather는 **시즌 축이자 여러 감정이 연결되는 형상화의 아이템**. 캐치 문구는 "나의 하루에 부드럽게 스며드는 작은 온기".
- 코드는 `butter-weather-shop`에서 가져오지 않았다. 설정·컨벤션 계층만 이식한 **0→1 신규 개발**이다.

### 표현 원칙 ★

- **설명을 많이 하지 않는다.** 긴 글로 설득하는 방식은 지양한다.
- 감각의 전달 수단은 **색상·구성·디자인**이다. 근거는 물건 안에 들어 있어야 하고, 말로 증명하지 않고 보이게 한다.
- 이 원칙은 UI 문구·상세페이지·에디토리얼 설계에 그대로 적용된다. 텍스트를 늘려 문제를 풀려 하지 말 것.

### ⚠️ 아직 정해지지 않은 것 (추측해서 진행하지 말 것)

- **무엇을 만들어 파는가** — 비즈공예·헤나타투가 후보지만 미확정이고, **지금 정하지 않는 것이 현재의 선택이다.** 우선순위는 물건이 아니라 **브랜딩·컨셉 구성**이다.
- ~~외부 접점~~ → **정해졌다.** 인스타그램 `@butterweather_`와 네이버 스마트스토어를 **새로 열지 않고 멈춘 그대로 이어간다.**
- **기존 조형 언어와 취향 좌표의 정합** — 2025년 자산은 손그림·원색·곰이고 레퍼런스 축은 구조·개념이다. 아직 한 얼굴로 정리되지 않았다.
- **결제 수단** — `@portone/browser-sdk`가 의존성에 있지만 아직 아무 데서도 쓰지 않는다
- **DB 스키마 전체** — Supabase 프로젝트가 아직 없다 (아래 3-2)
- **카탈로그의 시간 축**(캐리오버 vs 컬렉션) — 물건이 정해진 뒤에 결정한다

위 항목이 필요한 작업은 **먼저 사용자에게 확인**한다.

> 확정된 브랜드 정의의 전문·근거·레퍼런스는 **[docs/brand/foundation.md](docs/brand/foundation.md)** 에 있다. 브랜드·컨셉 관련 작업 전에 반드시 읽을 것.
> 레퍼런스 원본(이미지)은 **[docs/brand/references/](docs/brand/references/)** 에 쌓는다. 이나래 자료를 새로 받으면 여기에 저장하고 목록에 한 줄 추가한다.

## 2. 지금 레포 상태 (실측)

**앱 화면이 아직 하나도 없다.** `src/`에 있는 것은 CSS 두 개뿐이다.

```
src/app/globals.css        # Tailwind v4 진입점 + 다크모드 variant
src/app/styles/theme.css   # 브랜드 디자인 토큰
```

`app/layout.tsx`·`page.tsx`가 없어서 `npm run dev`를 띄워도 볼 화면이 없고, `npx next build`는 `/404` 라우트 하나만 생성한다. **앱 뼈대 세우기가 첫 개발 작업이다.**

레포에 있는 것: 툴링 설정(eslint·prettier·tsconfig·postcss), husky 훅, commitlint, GitHub 템플릿·워크플로우, `pr.sh`, 디자인 토큰.

### 정리 대상 (알고는 있되 지나가며 건드리지 말 것)

- `next.config.ts`의 이미지 호스트가 **옛 프로젝트의 Supabase 도메인**(`ljjpgsmufioeixspkrpw.supabase.co`)으로 박혀 있다. 새 프로젝트를 만들면 교체할 것.
- `package-json-addition.json`은 이미 `package.json`에 반영된 잔재 파일이다.
- `package-lock.json`의 `name`이 `butter-weather-shop`으로 남아 있다 (`npm install` 시 자동 수정됨).

## 3. 기술 스택 (`package.json` 실측)

- **Next.js 16.2.3** (App Router, Turbopack) + **React 19.2.4** + TypeScript 5
- **Tailwind CSS v4** (`@theme inline` 방식, `tailwind.config` 파일 없음)
- **Supabase** — `@supabase/supabase-js`, `@supabase/ssr`
- **TanStack Query v5** (서버 상태) + **Zustand v5** (클라이언트 상태)
- 스타일 유틸: `clsx`, `tailwind-merge`, `class-variance-authority`
- 분석: `posthog-js`
- 결제: `@portone/browser-sdk` — **의존성만 있고 미사용**
- 배포: Vercel 예정 (아직 레포에 연결 안 됨 — GitHub Deployments 0건)

> 옛 문서에 있던 Framer Motion·Toss Payments는 **이 레포 의존성에 없다.** 필요해지면 그때 추가한다.

### 3-2. Supabase — 아직 없음

새 프로젝트를 만들지 않았다. `.env.local`도 없다. 따라서 **테이블·RLS·Storage에 대해 이 문서가 단언하는 내용은 없다.**

DB 작업이 필요해지면 순서는 이렇다.

1. Supabase 프로젝트 생성 → `.env.local`에 URL·anon key
2. `next.config.ts` 이미지 호스트를 새 프로젝트 도메인으로 교체
3. 스키마 설계 → 이 문서에 확정 스키마 기록
4. RLS 정책 (공개는 읽기만, 쓰기는 관리자로 제한) — 대충 넘기지 말 것

## 4. 디자인 시스템 (`src/app/styles/theme.css` 실측)

| 토큰                           | 값                    | 용도                                           |
| ------------------------------ | --------------------- | ---------------------------------------------- |
| `--butter`                     | `#f5c842`             | 브랜드 메인 (light `#fdf3c0` / dark `#d4a800`) |
| `--sky`                        | `#a8d8ea`             | 브랜드 서브                                    |
| `--cloud`                      | `#f7f7f7`             | 배경 (다크 `#121212`)                          |
| `--ink`                        | `#1a1a1a`             | 본문 텍스트 (다크 `#f7f7f7`)                   |
| `--ink-muted` / `--ink-subtle` | `#6b6b6b` / `#c4c4c4` | 보조 · 비활성                                  |

- **다크모드는 `.dark` 클래스 수동 토글**이다 (OS 설정 자동 추종 아님). `@custom-variant dark`로 정의돼 있다.
- 브랜드 액센트(butter·sky)는 다크에서도 그대로 유지하고, 의미 토큰과 grayscale만 반전한다.
- Tailwind 유틸로 노출돼 있다 — `bg-butter`, `text-ink`, `bg-cloud`, `text-ink-muted` 등.
- 레이아웃 토큰: `--container-max: 1280px`, `--header-height: 64px`

## 5. Git · PR 규칙

**`main`은 보호됨** — 직접 push 금지. 브랜치 → PR → 리뷰 승인 1개 → 머지.

### 브랜치

`feature/작업내용` · `fix/버그내용` · `chore/설정내용` · `refactor/대상` · `docs/문서`
작업 시작 전 항상 `git pull`.

### 커밋 메시지

Conventional Commits + **gitmoji 접두사 선택 가능** (husky `commit-msg` 훅이 검사).

```
⚙️ chore: 설정 정리          ← 이모지 + 공백 + 타입
feat: 상품 목록 추가          ← 이모지 없이도 통과
```

허용 타입 7종: `feat` `fix` `refactor` `chore` `style` `docs` `assets` `test`
※ 이모지 뒤에 **공백 필수**, 타입은 **소문자**.

### PR 생성 — `./pr.sh`

```bash
./pr.sh <type> "<제목>" ["<설명>"] ["<close할 이슈번호>"]
./pr.sh feat "상품 목록 페이지"
./pr.sh chore "설정 정리" "husky/eslint 정리" 12
```

번호는 자동으로 매겨진다(이슈·PR 번호 공유 → 최댓값+1). 제목은 `[✨ Feature/8] 상품 목록 페이지` 형식.

| 타입       | 이모지 | 라벨       |
| ---------- | ------ | ---------- |
| `feat`     | ✨     | ✨Feature  |
| `fix`      | 🐛     | 🐛Fix      |
| `refactor` | ♻️     | ♻️Refactor |
| `chore`    | ⚙️     | ⚙️Chore    |
| `style`    | 🎨     | 🎨Style    |
| `assets`   | 🖼️     | 🖼️Assets   |
| `docs`     | 📝     | 📝Docs     |

### 머지

리뷰 승인 1개 후 머지. `main`에서 force push·브랜치 삭제 금지.

## 6. Slack 알림 — PR 본문이 곧 팀 공지다

| 채널           | 언제                         | 무엇이 나가나                               |
| -------------- | ---------------------------- | ------------------------------------------- |
| `#dev-pr`      | PR 오픈·재오픈·리뷰대기·머지 | 제목 + **PR 본문의 `## 📋 작업 내용` 전문** |
| `#deploy-live` | GitHub 릴리스 발행           | 버전 태그(`v1.0.0`) + **릴리스 노트 전문**  |

**중요:** 이 두 칸은 비개발자 동료가 읽는다. 전문 용어·파일 경로 나열이 아니라 **무엇이 달라졌는지**를 사람 말로 쓴다. 비우면 "요약 없음" 안내가 대신 나간다.

배포는 릴리스 발행으로 알린다 — `gh release create v1.0.0 --notes "..."` (프리릴리스는 `--prerelease`, '상용 아님'으로 표시됨).

워크플로우: `.github/workflows/slack-pr-notify.yml`, `slack-deploy-notify.yml`
시크릿: `SLACK_WEBHOOK_PR`, `SLACK_WEBHOOK_DEPLOY`

## 7. 작업 원칙

- **한 번에 한 기능씩.** 요청받은 범위를 넘어 리팩터링하거나 기능을 부풀리지 않는다.
- **모르는 건 지어내지 않는다.** 특히 DB 스키마·시장·결제 — 위 "아직 정해지지 않은 것"에 걸리면 먼저 묻는다.
- **가격은 정수로 다룬다** (원 단위). 다국가는 통화별 컬럼을 나눈다.
- RLS는 대충 넘기지 않는다. 쓰기 권한은 반드시 제한한다.
- 커밋 전 `npm run lint`·타입 에러 확인. husky가 staged 파일에 eslint·prettier를 자동 적용한다.

## 8. 다음 작업 후보

1. **앱 뼈대** — `src/app/layout.tsx` + `page.tsx`, 폰트·`globals.css` 연결. 화면이 떠야 나머지가 가능하다.
2. **Supabase 연결** — 프로젝트 생성 → `.env.local` → `lib/supabase` (client/server 분리) → `next.config.ts` 호스트 교체
3. **제품 정의 확정** — 시장·통화·결제 수단을 정하고 이 문서 1절을 갱신
