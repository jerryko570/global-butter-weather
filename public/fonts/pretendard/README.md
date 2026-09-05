# Pretendard (동적 서브셋)

- 버전: **v1.3.9** · 라이선스: SIL Open Font License 1.1
- 원본: https://github.com/orioncactus/pretendard

## 왜 이렇게 두었나

`next/font`를 쓰지 않고 파일을 직접 넣었다. 이유는 두 가지다.

1. **통짜 variable 파일은 2.0MB다.** 첫 화면에서 그만큼을 받게 할 수 없다.
2. 동적 서브셋은 `unicode-range`로 92개 파일을 나눠 **브라우저가 실제로 쓰인 글자의 조각만** 받는다. 한글 페이지에서 보통 100KB 안팎이다. `next/font/local`은 `unicode-range`를 지원하지 않아 이 방식을 쓸 수 없다.

## 갱신하는 법

```bash
npm i -D pretendard
cp node_modules/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css public/fonts/pretendard/pretendard.css
cp -r node_modules/pretendard/dist/web/variable/woff2-dynamic-subset public/fonts/pretendard/
npm uninstall pretendard
```

CSS 안의 경로가 `./woff2-dynamic-subset/...` 상대경로라 이 폴더 구조를 유지해야 한다.
