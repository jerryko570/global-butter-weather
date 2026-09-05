import type { Metadata } from 'next'
import Header from '@/components/Header'
import './globals.css'

export const metadata: Metadata = {
  title: '버터웨더',
  description: '나의 하루에 부드럽게 스며드는 작은 온기',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard 동적 서브셋. unicode-range로 쪼개져 있어 브라우저가 실제로
            쓰인 글자의 조각만 받는다. next/font/local은 unicode-range를 지원하지
            않아 쓸 수 없다. 자세한 사정은 public/fonts/pretendard/README.md */}
        {/* eslint-disable-next-line @next/next/no-css-tags -- 위 사유로 의도한 것 */}
        <link rel="stylesheet" href="/fonts/pretendard/pretendard.css" />
      </head>
      {/* 배경·본문색·font는 globals.css에서 token으로 잡는다.
          틀은 조용해야 하므로 여기서 더 얹지 않는다 (foundation.md 5-8절). */}
      <body className="flex min-h-dvh flex-col antialiased">
        <Header />
        {children}
      </body>
    </html>
  )
}
