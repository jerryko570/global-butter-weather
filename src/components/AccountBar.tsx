import AuthLinks from '@/components/AuthLinks'
import CartLink from '@/components/CartLink'

/**
 * 본문 위의 얇은 줄. 계정과 장바구니만 둔다.
 *
 * **티커 띠(무료배송 기준·입고 주기)는 두지 않는다** — 이나래가 빼라고
 * 했다 (2026-09-15). 다시 넣지 말 것.
 *
 * **로그인과 장바구니 둘 다 실제로 이어져 있다.** 회원가입 링크는 두지
 * 않는다 — 가입이라는 단계가 없다 (구글·카카오로 바로 들어온다).
 */
export default function AccountBar() {
  return (
    <div className="flex items-center justify-end gap-5 border-b border-gray-200 px-6 py-3">
      <AuthLinks />
      <CartLink />
    </div>
  )
}
