import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '버터웨더',
  description: '나의 하루에 부드럽게 스며드는 작은 온기',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: 아래 스크립트가 hydration 전에 .dark를
    // React 모르게 직접 붙인다. 의도한 불일치라 React가 서버 렌더링과
    // 다르다고 콘솔에 경고하는 것을 여기서만 끈다. class를 React 상태로
    // 옮겨 관리하려 시도하지 말 것 — 그러면 이 스크립트를 쓰는 이유(첫
    // 페인트 전에 반영)가 사라진다.
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 다크모드는 OS 설정을 따라가지 않고 localStorage에 저장된 선택만
            읽는다 (CLAUDE.md 4절). CSS·React가 로드되기 전에 .dark를 먼저
            붙여야 화면이 밝은 채로 한 프레임 그려졌다 어두워지는 깜빡임이
            없다. ThemeToggle의 useSyncExternalStore가 hydration 직후
            이 결과를 다시 읽어 React 상태와 맞춘다. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}",
          }}
        />
        {/* Pretendard 동적 서브셋. unicode-range로 쪼개져 있어 브라우저가 실제로
            쓰인 글자의 조각만 받는다. next/font/local은 unicode-range를 지원하지
            않아 쓸 수 없다. 자세한 사정은 public/fonts/pretendard/README.md */}
        {/* eslint-disable-next-line @next/next/no-css-tags -- 위 사유로 의도한 것 */}
        <link rel="stylesheet" href="/fonts/pretendard/pretendard.css" />
        {/* 나눔명조 — 브랜드의 목소리(제목·지표·워드마크·태그라인)에만 쓴다.
            같은 이유로 동적 서브셋이다. public/fonts/nanum-myeongjo/README.md */}
        {/* eslint-disable-next-line @next/next/no-css-tags -- 위 사유로 의도한 것 */}
        <link
          rel="stylesheet"
          href="/fonts/nanum-myeongjo/nanum-myeongjo.css"
        />
      </head>
      {/* 배경·본문색·font는 globals.css에서 token으로 잡는다.
          틀은 조용해야 하므로 여기서 더 얹지 않는다 (foundation.md 5-8절).

          **전역 Header는 없다.** 첫 화면이 왼쪽 고정 사이드바 구조로 정해지면서
          상단 bar가 자리를 잃었다 (2026-09-15). ThemeToggle을 비롯한 전역 제어는
          사이드바가 맡는다. 상단에 다시 bar를 두려 하지 말 것 — 사이드바와
          역할이 겹친다. */}
      <body className="flex min-h-dvh flex-col antialiased">{children}</body>
    </html>
  )
}
