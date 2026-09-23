'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  cancelPayment,
  getPayment,
  isCard,
  isPaid,
} from '@/lib/payments/portone'
import { classifyPaidError } from '@/lib/payments/complete'

/**
 * 결제. **두 걸음이다 — 준비하고, 확정한다.**
 *
 * ```
 * preparePayment(orderNo)   서버가 paymentId 를 발급해 주문에 저장한다
 *        ↓
 * PortOne.requestPayment()  브라우저에서 결제창이 뜬다
 *        ↓
 * confirmPayment(orderNo)   서버가 포트원에 직접 물어보고 재고를 깎는다
 * ```
 *
 * ---
 *
 * ## 왜 `paymentId` 를 서버가 발급하는가 ★
 *
 * 화면이 만들어 보내게 두면 **남의 결제 번호를 가져다 쓸 수 있다** —
 * 금액만 맞으면 통과하므로, 11,900원짜리를 한 번 결제하고 그 번호로
 * 같은 금액의 주문을 여러 개 완료시킬 수 있다.
 *
 * 서버가 발급해 주문에 저장해 두면 **화면이 고를 여지가 없다.**
 * `confirmPayment` 는 화면이 보낸 번호를 쓰지 않고 **DB 에 적힌 것**을 본다.
 */

export type PreparePaymentResult =
  | {
      ok: true
      paymentId: string
      orderName: string
      totalKrw: number
    }
  | { ok: false; reason: string }

/**
 * 결제 번호를 발급한다. **다시 부르면 새로 발급된다** — 결제가 한 번
 * 실패하면 포트원이 같은 번호를 다시 받아주지 않기 때문이다.
 */
export async function preparePayment(
  orderNo: string
): Promise<PreparePaymentResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: '로그인이 필요합니다.' }

  // RLS 가 남의 주문을 막는다. 여기서 user_id 를 다시 비교하지 않는 이유다
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, total_krw, items:order_items(product_name)')
    .eq('order_no', orderNo)
    .maybeSingle()

  if (!order) return { ok: false, reason: '주문을 찾지 못했습니다.' }
  if (order.status !== 'pending') {
    return { ok: false, reason: '이미 처리된 주문입니다.' }
  }

  const paymentId = crypto.randomUUID()

  // **쓰는 것은 service_role 이다.** 손님에게 orders update 권한을 열면
  // payment_id 만 열리지 않는다 — RLS 는 행을 가르지 컬럼을 가르지 않아서
  // 같은 정책으로 total_krw·status 도 고칠 수 있게 된다.
  // 위에서 RLS 로 「내 주문이고 pending」인 것을 이미 확인했다
  const admin = createAdminClient()
  const { data: updated } = await admin
    .from('orders')
    .update({ payment_id: paymentId, payment_provider: 'portone' })
    .eq('id', order.id)
    .eq('status', 'pending')
    .select('id')

  if (!updated || updated.length === 0) {
    return { ok: false, reason: '결제를 준비하지 못했습니다.' }
  }

  // 결제창에 보일 이름. 「플라워가든 비즈 키링 외 2건」
  const items = (order.items ?? []) as { product_name: string }[]
  const orderName =
    items.length === 0
      ? '버터웨더 주문'
      : items.length === 1
        ? items[0].product_name
        : `${items[0].product_name} 외 ${items.length - 1}건`

  return { ok: true, paymentId, orderName, totalKrw: order.total_krw }
}

export type ConfirmPaymentResult = { ok: true } | { ok: false; reason: string }

/**
 * 결제를 확정한다. **화면 말을 믿지 않는다.**
 *
 * 1. DB 에 적힌 `payment_id` 로 포트원에 직접 묻는다
 * 2. 상태가 `PAID` 이고 **금액이 주문의 총액과 같아야** 통과
 * 3. `mark_order_paid()` 가 재고를 깎고 상태를 `paid` 로 바꾼다
 *
 * 2에서 어긋나면 **결제를 취소한다.** 손님 돈이 빠져나갔는데 주문은
 * 완료되지 않은 상태를 남기지 않는다.
 *
 * 3이 실패하는 것은 대개 **재고가 모자란** 경우다(`OUT_OF_STOCK`).
 * 그때도 취소한다 — 팔 수 없는 것에 돈을 받아둘 수 없다.
 */
export async function confirmPayment(
  orderNo: string
): Promise<ConfirmPaymentResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: '로그인이 필요합니다.' }

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, total_krw, payment_id')
    .eq('order_no', orderNo)
    .maybeSingle()

  if (!order) return { ok: false, reason: '주문을 찾지 못했습니다.' }
  if (order.status === 'paid') return { ok: true } // 두 번 불려도 괜찮다
  if (order.status !== 'pending') {
    return { ok: false, reason: '이미 처리된 주문입니다.' }
  }
  if (!order.payment_id) {
    return { ok: false, reason: '결제 정보가 없습니다.' }
  }

  // ── 1·2. 포트원에 직접 묻는다 ─────────────────────────────
  let payment
  try {
    payment = await getPayment(order.payment_id)
  } catch {
    return {
      ok: false,
      reason:
        '결제를 확인하지 못했습니다. 잠시 뒤 주문 내역에서 다시 확인해 주세요.',
    }
  }

  if (!isPaid(payment, order.total_krw)) {
    // 결제는 됐는데 금액이 다르다 — **말만 하고 두면 손님 돈이 묶인다.**
    // 실제로 취소를 걸고, 그것마저 실패하면 손님에게 알린다
    if (payment.status === 'PAID') {
      try {
        await cancelPayment(order.payment_id, '주문 금액 불일치')
      } catch {
        return {
          ok: false,
          reason:
            '결제 금액이 주문 금액과 다릅니다. 취소가 자동으로 되지 않았습니다 — 문의해 주세요.',
        }
      }
      return {
        ok: false,
        reason: '결제 금액이 주문 금액과 다릅니다. 결제를 취소했습니다.',
      }
    }
    return { ok: false, reason: '결제가 완료되지 않았습니다.' }
  }

  // ── 2-b. 카드가 아니면 받지 않는다 ─────────────────────────
  // 결제창을 카드로 잠그는 방법이 없어 **받은 뒤에 거른다** (portone.ts)
  if (!isCard(payment)) {
    try {
      await cancelPayment(order.payment_id, '카드 결제만 받습니다')
    } catch {
      return {
        ok: false,
        reason:
          '카드로만 결제할 수 있습니다. 취소가 자동으로 되지 않았습니다 — 문의해 주세요.',
      }
    }
    return {
      ok: false,
      reason: '카드로만 결제할 수 있습니다. 결제를 취소했습니다.',
    }
  }

  // ── 3. 재고를 깎고 완료로 ─────────────────────────────────
  // **service_role 로만 부를 수 있다** — 결제가 실제로 됐는지는 서버만
  // 알기 때문이다 (0005_orders.sql)
  const admin = createAdminClient()
  const { error } = await admin.rpc('mark_order_paid', {
    p_order_id: order.id,
    p_provider: 'portone',
    p_payment_id: order.payment_id,
  })

  if (error) {
    const failure = classifyPaidError(error.message ?? '')

    // **이미 끝났다는 말은 실패가 아니다.** 웹훅이 먼저 도착한 경우다
    // (complete.ts). 여기서 취소를 걸면 멀쩡한 결제가 취소된다
    if (failure.kind === 'already') {
      const { data: now } = await supabase
        .from('orders')
        .select('status')
        .eq('id', order.id)
        .maybeSingle()
      if (now?.status === 'paid') return { ok: true }
      return { ok: false, reason: '이미 처리된 주문입니다.' }
    }

    // 다시 해도 안 되는 것에만 돈을 돌려준다
    if (failure.kind === 'stock') {
      try {
        await cancelPayment(order.payment_id, '재고 부족')
      } catch {
        // 취소까지 실패하면 사람이 봐야 한다. 손님에게는 아래 문구가 간다
      }
      return {
        ok: false,
        reason: `${failure.detail} 이(가) 방금 품절됐습니다. 결제를 취소했습니다.`,
      }
    }

    // **모르는 실패에는 돈을 돌려주지 않는다.** 일시적인 것일 수 있고,
    // 웹훅이 다시 와서 끝낼 수도 있다
    return {
      ok: false,
      reason:
        '주문을 완료하지 못했습니다. 결제는 그대로 있습니다 — 주문 내역에서 다시 확인해 주세요.',
    }
  }

  return { ok: true }
}
