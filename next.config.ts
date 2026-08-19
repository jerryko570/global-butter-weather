import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // 프로젝트 루트를 이 폴더로 못박는다.
  // (홈 디렉토리에 떠돌이 lockfile이 있어서 Next.js가 루트를 헷갈리던 경고 해결)
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Supabase Storage의 이미지를 next/image로 띄우려면 호스트를 허용해야 한다.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ljjpgsmufioeixspkrpw.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // 임시 플레이스홀더 이미지 (레이아웃 확인용 — 실제 촬영컷으로 교체 예정)
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
}

export default nextConfig
