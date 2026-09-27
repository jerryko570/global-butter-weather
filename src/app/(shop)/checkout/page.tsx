import { redirect } from 'next/navigation'
import CheckoutForm from './CheckoutForm'
import { createClient } from '@/lib/supabase/server'
import type { ShippingInfo } from '@/types/order'

/**
 * 주문서. **로그인한 사람만 들어온다** (회원 필수, schema.md 7-3절).
 *
 * 여기서 막는 이유는 안전이 아니라 **헛걸음을 없애려는 것**이다 — 배송지를
 * 다 채우고 나서 「로그인이 필요합니다」가 뜨면 나쁘다. 진짜로 막는 것은
 * RLS 다 (`orders_insert_own`).
 *
 * 장바구니는 브라우저에 있어 서버가 모른다. 그래서 담긴 것이 없는 경우는
 * 여기서 판단하지 않고 `CheckoutForm` 이 한다.
 *
 * ---
 *
 * ## 지난 배송지를 미리 채운다 ★ (2026-09-27)
 *
 * 간편 로그인으로 가입의 문턱은 없앴는데 **주문할 때마다 이름·연락처·주소를
 * 다시 쓰고 있었다.** 두 번째 주문부터는 그게 가입보다 더 성가신 일이다.
 *
 * **표를 따로 만들지 않는다.** 배송지는 이미 주문마다 박제돼 있으므로
 * (`orders.shipping_info`), **가장 최근 주문의 것을 그대로 가져오면 된다.**
 * 「기본 배송지」라는 개념을 새로 만들면 그것을 고치고 지우는 화면이
 * 따라붙는다 — 지금 단계에 그만한 값어치가 없다.
 *
 * 취소된 주문도 센다. **주소는 주문의 성패와 상관이 없다.**
 *
 * ⚠️ **동의는 가져오지 않는다.** 개인정보 수집·이용 동의는 주문마다 받아야
 * 하는 것이라(전자상거래법) 미리 체크해 두면 안 된다. 주소는 편의이고
 * 동의는 의사표시다 — 둘을 같이 기억하면 안 된다.
 */
export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent('/checkout')}`)
  }

  // RLS 가 남의 주문을 막는다 (`orders_own`). 여기서 user_id 를 다시
  // 비교하지 않는 이유다
  const { data: last } = await supabase
    .from('orders')
    .select('shipping_info')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 px-7 py-5">
        <h1 className="text-ink text-title font-serif">주문서</h1>
      </div>
      <CheckoutForm
        lastShipping={(last?.shipping_info as ShippingInfo | undefined) ?? null}
      />
    </>
  )
}
