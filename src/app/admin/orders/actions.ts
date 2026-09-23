'use server'

import { revalidatePath } from 'next/cache'
import { cancelPayment } from '@/lib/payments/portone'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * 관리자가 주문을 취소한다. **돈을 움직이는 버튼이다.**
 *
 * ---
 *
 * ## 화면이 아니라 여기서 막는다 ★
 *
 * 어드민 화면은 주소만 알면 누구나 열 수 있다(`admin/layout.tsx`). 상품은
 * RLS 가 쓰기를 막아주지만 **이 함수는 `service_role` 을 쓰므로 RLS 를
 * 지나간다.** 그래서 여기서 직접 `is_admin()` 을 묻는다.
 *
 * **이 검사를 빼면 주문번호만 알면 누구나 남의 결제를 취소할 수 있다.**
 *
 * ---
 *
 * ## 돈부터 돌려주고 DB 를 바꾼다 ★
 *
 * 순서가 중요하다. DB 를 먼저 `cancelled` 로 바꾸면, 결제 취소가 실패했을
 * 때 **취소된 것처럼 보이는데 돈은 그대로**인 상태가 남는다. 그쪽이 훨씬
 * 나쁘다.
 *
 * 반대로 돈을 먼저 돌려주고 DB 가 실패하면 **웹훅이 고쳐 준다** —
 * 포트원이 `Transaction.Cancelled` 를 보내주고, 그것이 같은
 * `mark_order_cancelled()` 를 부른다 (schema.md 7-5절).
 */

export type CancelOrderResult = { ok: true } | { ok: false; reason: string }

export async function cancelOrder(
  orderNo: string,
  reason: string
): Promise<CancelOrderResult> {
  const trimmed = reason.trim()
  if (!trimmed) return { ok: false, reason: '취소 사유를 적어 주세요.' }

  // ── 관리자인가 ─────────────────────────────────────────────
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) {
    return { ok: false, reason: '관리자만 주문을 취소할 수 있습니다.' }
  }

  const db = createAdminClient()
  const { data: order } = await db
    .from('orders')
    .select('id, status, payment_id')
    .eq('order_no', orderNo)
    .maybeSingle()

  if (!order) return { ok: false, reason: '주문을 찾지 못했습니다.' }
  if (order.status === 'cancelled') return { ok: true }
  if (order.status === 'shipped' || order.status === 'done') {
    return {
      ok: false,
      reason:
        '이미 보낸 주문입니다. 무르는 것은 반품이라 따로 처리해야 합니다.',
    }
  }

  // ── 돈부터 ─────────────────────────────────────────────────
  // `pending` 은 결제된 적이 없어 돌려줄 것이 없다
  if (order.status === 'paid' && order.payment_id) {
    try {
      await cancelPayment(order.payment_id, trimmed)
    } catch {
      return {
        ok: false,
        reason:
          '결제를 취소하지 못했습니다. 주문은 그대로 두었습니다 — 포트원 콘솔에서 확인해 주세요.',
      }
    }
  }

  // ── 그다음 DB ──────────────────────────────────────────────
  const { error } = await db.rpc('mark_order_cancelled', {
    p_order_id: order.id,
    p_reason: trimmed,
  })
  if (error) {
    return {
      ok: false,
      reason: `결제는 취소됐지만 주문에 반영하지 못했습니다 — ${error.message}`,
    }
  }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderNo}`)
  // 재고가 돌아왔으므로 가게 화면도 다시 굽는다
  revalidatePath('/', 'layout')
  return { ok: true }
}
