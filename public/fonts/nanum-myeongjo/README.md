# 나눔명조 (동적 서브셋)

- 라이선스: SIL Open Font License 1.1 · 원본: Google Fonts `Nanum Myeongjo` v31
- 굵기: **400 하나만** 싣는다. 이 디자인은 제목에 굵기를 쓰지 않는다 — serif라는 것 자체가 이미 강조다 (tokens.md 3-5절).

## 왜 이 서체인가

계승한 디자인(옛 `butter-weather-shop`)은 웹폰트를 싣지 않고 `font-serif`만 써서, **보는 기기마다 다른 서체로 떨어졌다.** 이나래의 macOS에서는 `AppleMyungjo`, Windows에서는 `바탕`이었다. 브랜드 제목이 사람마다 다른 얼굴이었다는 뜻이다.

나눔명조를 고른 이유는 **이나래가 디자인할 때 보고 있던 `AppleMyungjo`에 가장 가까운 한글 명조**이기 때문이다. 새 얼굴을 고르는 것이 아니라 보고 있던 것을 고정하는 쪽이다.

> **바꾸려면 한 줄이다.** `src/app/styles/typography.css`의 `--serif` 맨 앞 이름과 `layout.tsx`의 CSS 링크만 갈면 된다. 후보는 tokens.md 3-3절.

## 왜 이렇게 두었나

Pretendard와 같은 이유다. `next/font`를 쓰지 않고 파일을 직접 넣었다.

1. 한글 서체는 통짜로 받으면 크다. 나눔명조 400 하나가 **1.76MB**다.
2. 동적 서브셋은 `unicode-range`로 **92개 파일**을 나눠 브라우저가 실제로 쓰인 글자의 조각만 받는다. 지금 첫 화면처럼 제목 몇 줄에만 쓰면 수십 KB에 그친다. `next/font/local`은 `unicode-range`를 지원하지 않아 이 방식을 쓸 수 없다.

## 갱신하는 법

Google Fonts의 CSS를 받아 `gstatic.com` 주소를 로컬 경로로 바꾸고, 그 주소의 woff2를 전부 내려받는다.

```bash
curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36" \
  "https://fonts.googleapis.com/css2?family=Nanum+Myeongjo&display=swap" -o nm.css
```

- **User-Agent가 중요하다.** 옛 브라우저로 보이면 woff2 대신 ttf를 준다.
- CSS 안의 경로를 `./woff2-dynamic-subset/<파일명>`으로 바꾸고 이 폴더 구조를 유지해야 한다.
- 파일 수가 92개에서 달라지면 Google이 서브셋을 다시 나눈 것이다. 그대로 받으면 된다.
