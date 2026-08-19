# global-butter-weather

날씨 서비스 프로젝트 🌤️

## 협업 규칙

- `main` 브랜치는 **보호됨** → 직접 push 금지, 반드시 PR로 반영
- 작업은 항상 브랜치를 파서 진행: `feature/작업내용`
- 작업 시작 전 `git pull`로 최신 상태 유지
- PR은 상대방 **리뷰 승인 1개** 후 머지

## 시작하기

```bash
git clone https://github.com/jerryko570/global-butter-weather.git
cd global-butter-weather
git checkout -b feature/my-work
```

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
