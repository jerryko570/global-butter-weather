'use client'

import Link from 'next/link'
import { useCartCount } from '@/lib/store/cart'

/**
 * 상단 줄의 장바구니 링크. **숫자가 실제 담긴 개수다.**
 *
 * 이것만 client 인 이유는 장바구니가 브라우저에만 있기 때문이다.
 * `AccountBar` 전체를 client 로 만들면 로그인·회원가입 링크까지 딸려
 * 들어간다 — 그럴 이유가 없다.
 *
 * 서버가 그릴 때는 `0` 이다. 담긴 것을 서버가 알 수 없으므로 그렇고,
 * React 가 붙은 뒤에 실제 값으로 한 번 다시 그린다 (`useCartCount`).
 */
export default function CartLink() {
  const count = useCartCount()

  return (
    <Link
      href="/cart"
      className="text-ink-muted hover:text-ink text-caption tracking-wide uppercase"
    >
      Cart ({count})
    </Link>
  )
}
