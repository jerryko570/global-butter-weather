/**
 * 본문 위의 얇은 줄. 계정과 장바구니만 둔다.
 *
 * **티커 띠(무료배송 기준·입고 주기)는 두지 않는다** — 이나래가 빼라고
 * 했다 (2026-09-15). 다시 넣지 말 것.
 *
 * ⚠️ 링크는 아직 아무 데도 가지 않는다. 로그인·장바구니는 M3다.
 */
export default function AccountBar() {
  return (
    <div className="flex items-center justify-end gap-5 border-b border-gray-200 px-6 py-3">
      <a href="#" className="text-ink-muted hover:text-ink text-caption">
        로그인
      </a>
      <a href="#" className="text-ink-muted hover:text-ink text-caption">
        회원가입
      </a>
      <a
        href="#"
        className="text-ink-muted hover:text-ink text-caption tracking-wide uppercase"
      >
        Cart (0)
      </a>
    </div>
  )
}
