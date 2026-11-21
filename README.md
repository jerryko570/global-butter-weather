# global-butter-weather

이나래의 감각을 파는 브랜드, 버터웨더의 쇼핑몰 🌤️ — https://global-butter-weather.vercel.app

> 폴더 이름이 `butter-weather` 여도 이 저장소다. 이름이 비슷한 `jerryko570/butter-weather-shop` 은 **옛 레포**다 — 코드는 가져오지 않고 디자인과 `products` 모양만 계승한다(CLAUDE.md 1절).

프로젝트 기준 문서는 [CLAUDE.md](CLAUDE.md)를 본다.

## 협업 규칙

- `main` 브랜치는 **보호됨** → 직접 push 금지, 반드시 PR로 반영
- 작업은 항상 브랜치를 파서 진행: `feature/작업내용`
- 작업 시작 전 `git pull`로 최신 상태 유지
- PR은 반드시 만들되 **승인 없이 머지**한다 (2026-09-22부터. CLAUDE.md 5절)

## 시작하기 — 새 기기에서

코드·문서·작업 기록은 전부 GitHub 에 있다. **저장소 밖에 있는 것은 `.env.local` 하나뿐이다.**

**1. 도구** — Node 24 · `git` · [`gh`](https://cli.github.com/)

```bash
gh auth login                 # pr.sh 가 gh 로 PR 을 만든다
git clone https://github.com/jerryko570/global-butter-weather.git
cd global-butter-weather
npm install                   # husky 훅도 여기서 깔린다
```

- **brew 로 받은 `node@24` 는 깔기만 해서는 `node` 가 안 잡힌다** — 다른 버전과 부딪히지 않게 brew 가 경로에 걸지 않는다. 한 번 걸어 둔다:
  ```bash
  echo 'export PATH="/opt/homebrew/opt/node@24/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
  ```
- **npm 11 은 패키지의 설치 스크립트를 허락 없이 돌리지 않는다.** `npm install` 끝에 `sharp` · `core-js` · `unrs-resolver` 경고가 나와도 `npm run dev` 는 뜬다. 이미지 최적화가 깨지면 `npm install-scripts approve sharp` 뒤 `npm install` 을 다시 한다

**2. `.env.local`** — 키 일곱 개. 목록과 각각 어디서 받는지는 [`.env.example`](.env.example)에 있다.

- **쓰던 기기의 `.env.local` 을 그대로 옮기는 게 가장 빠르다.** USB·비밀번호 관리자처럼 남지 않는 길로 옮긴다. **git·Slack·메일로 보내지 않는다** — `SUPABASE_SECRET_KEY` 는 RLS 를 지나는 키다
- 옮길 수 없으면 각 대시보드에서 다시 받는다. Vercel 에 **Secret** 으로 넣은 셋(`SUPABASE_SECRET_KEY` · `PORTONE_API_SECRET` · `PORTONE_WEBHOOK_SECRET`)은 저장 후 값을 볼 수 없어 `vercel env pull` 로도 안 나온다 — Supabase·포트원 대시보드에서 받는다
- **이름은 정확히 `.env.local`, 자리는 `package.json` 옆이다.** 옮기는 길에 앞의 `.` 이 빠지거나 `.txt` 가 붙기 쉽다(`env.local.txt`) — 그러면 `npm run dev` 의 `Environments:` 줄에 `.env.local` 이 안 뜬다. Finder 는 `.` 으로 시작하는 파일을 숨기므로 `Cmd + Shift + .` 으로 보이게 하고 확인한다

**3. 확인**

```bash
npm run dev                   # http://localhost:3000 에 상품이 보이면 Supabase 연결 OK
npm run lint
```

**4. 이어서 하기** — 지금 어디까지 왔는지는 [CLAUDE.md](CLAUDE.md) 9절과 [roadmap](docs/plan/roadmap.md)의 「아직 안 만든 것」. Claude Code 는 CLAUDE.md 를 저절로 읽으므로 따로 설명하지 않아도 맥락을 잇는다.

작업은 브랜치를 파서 `./pr.sh` 로 PR 을 만든다 (CLAUDE.md 5절).

## 알림 (Slack)

| 채널           | 언제                              | 내용                                    |
| -------------- | --------------------------------- | --------------------------------------- |
| `#dev-pr`      | PR 열림·재오픈·리뷰요청·머지·닫힘 | 제목 + PR 본문의 `## 📋 작업 내용` 요약 |
| `#deploy-live` | GitHub 릴리스 발행 시             | 버전(`v1.0.0`) + 릴리스 노트            |

- 알림 본문은 **PR 본문 / 릴리스 노트를 그대로** 가져온다. 비개발자도 읽을 수 있게 써야 알림이 쓸모 있다.
- 워크플로우: `.github/workflows/slack-pr-notify.yml`, `.github/workflows/slack-deploy-notify.yml`
- 시크릿: `SLACK_WEBHOOK_PR`, `SLACK_WEBHOOK_DEPLOY` (레포 Settings → Secrets → Actions)

## 배포

상용 배포는 **GitHub 릴리스 발행**으로 알린다. 릴리스를 만들어야 `#deploy-live`에 알림이 간다.

```bash
gh release create v1.0.0 --title "v1.0.0" --notes "장바구니 합구매 기능 오픈"
gh release create v1.1.0-rc.1 --prerelease --notes "테스트 배포"   # 상용 아님으로 표시
```

버전은 [유의적 버전](https://semver.org/lang/ko/)을 따른다 — `v메이저.마이너.패치`.
