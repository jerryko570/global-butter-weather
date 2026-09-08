import type { MetadataRoute } from 'next'

/**
 * 검색 노출 차단. 지금 화면은 M0 임시본이라 검색에 잡히면 안 된다.
 *
 * M1에서 첫 화면이 서면 아래 disallow를 지우고 sitemap을 붙인다.
 * 환경변수로 나누지 않고 코드에 박아둔 것은, 지금 단계에서 프리뷰와
 * 프로덕션을 가를 이유가 없고 조건이 늘면 왜 막혔는지 추적이 어려워지기
 * 때문이다. 풀 때는 이 파일 하나만 고치면 된다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  }
}
