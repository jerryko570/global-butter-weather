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
    <html lang="ko">
      {/* 배경·본문색은 globals.css에서 --cloud / --ink로 잡는다.
          틀은 조용해야 하므로 여기서 색을 더 얹지 않는다 (foundation.md 5-8절). */}
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  )
}
