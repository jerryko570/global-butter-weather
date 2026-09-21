import { redirect } from 'next/navigation'
import CheckoutForm from './CheckoutForm'
import { createClient } from '@/lib/supabase/server'

/**
 * 주문서. **로그인한 사람만 들어온다** (회원 필수, schema.md 7-3절).
 *
 * 여기서 막는 이유는 안전이 아니라 **헛걸음을 없애려는 것**이다 — 배송지를
 * 다 채우고 나서 「로그인이 필요합니다」가 뜨면 나쁘다. 진짜로 막는 것은
 * RLS 다 (`orders_insert_own`).
 *
 * 장바구니는 브라우저에 있어 서버가 모른다. 그래서 담긴 것이 없는 경우는
 * 여기서 판단하지 않고 `CheckoutForm` 이 한다.
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

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 px-7 py-5">
        <h1 className="text-ink text-title font-serif">주문서</h1>
      </div>
      <CheckoutForm />
    </>
  )
}
