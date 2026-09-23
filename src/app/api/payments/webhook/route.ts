import { Webhook } from '@portone/server-sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  cancelPayment,
  getPayment,
  isCard,
  isPaid,
} from '@/lib/payments/portone'

/**
 * 포트원 웹훅. **브라우저가 돌아오지 않아도 주문이 맞춰진다.**
 *
 * ---
 *
 * ## 왜 필요한가 ★
 *
 * 지금까지 결제 확정은 **브라우저가 돌아오는 것**에 걸려 있었다. 결제하고
 * 창을 닫아버리면 돈은 나갔는데 주문은 `pending` 으로 남는다. 반대쪽도
 * 있다 — 포트원 콘솔에서 환불하면 우리는 모른 채 주문이 `paid` 이고
 * **재고는 깎인 그대로**다. 2026-09-22에 실제로 그래서 손으로 되돌렸다.
 *
 * 웹훅은 **결제사가 우리에게 직접 말해주는 통로**라 브라우저와 무관하다.
 *
 * ---
 *
 * ## 웹훅을 믿지 않는다 ★
 *
 * 이 주소는 인터넷에 열려 있다. 아무나 「결제됐다」고 보낼 수 있다.
 * 그래서 두 겹으로 막는다.
 *
 * 1. **서명 검증** — 포트원이 서명한 것인지 확인한다 (`PORTONE_WEBHOOK_SECRET`)
 * 2. **다시 물어본다** — 서명이 맞아도 본문의 말을 믿지 않고
 *    포트원 API 로 조회해 **상태와 금액**을 직접 확인한다
 *
 * 2를 빼면 안 된다. 서명은 「포트원이 보냈다」까지만 보장하고
 * **「얼마가 결제됐는가」는 보장하지 않는다.**
 *
 * ---
 *
 * ## 같은 통지가 여러 번 온다
 *
 * 포트원은 실패 시 최대 5회 재전송한다(0→1→4→16→64→256분). 그래서
 * `mark_order_paid()` 와 `mark_order_cancelled()` 는 **두 번 불려도
 * 괜찮게** 돼 있다 — 앞쪽은 `pending` 일 때만 움직이고, 뒤쪽은 이미
 * 취소면 그냥 돌아간다.
 *
 * **200 을 돌려줘야 재전송이 멈춘다.** 그래서 우리가 처리할 수 없는
 * 종류(가상계좌 발급 등)도 200 으로 답한다 — 모르는 것이지 실패가 아니다.
 */

/** 처리하지 못한 것도 200 이다. 재전송을 부르지 않기 위해서다 */
function ok(note: string) {
  return Response.json({ ok: true, note })
}

/**
 * 취소를 걸되 **실패해도 이 통지를 실패로 만들지 않는다.**
 *
 * 취소가 안 되는 것과 통지를 못 받은 것은 다른 문제다. 여기서 던지면
 * 포트원이 같은 통지를 5번 더 보내고, 그때마다 취소를 다시 시도한다.
 */
async function cancelSafely(paymentId: string, reason: string) {
  try {
    await cancelPayment(paymentId, reason)
  } catch (err) {
    // 사람이 봐야 한다. 손님 돈이 묶인 채로 아무도 모르면 안 된다
    console.error('[webhook] 취소 실패', paymentId, reason, err)
  }
}

export async function POST(req: Request) {
  const secret = process.env.PORTONE_WEBHOOK_SECRET
  if (!secret) {
    // 500 이면 포트원이 재전송한다. 설정이 붙는 동안 통지가 버려지지 않는다
    return Response.json(
      { ok: false, note: 'PORTONE_WEBHOOK_SECRET 이 없습니다' },
      { status: 500 }
    )
  }

  // **본문을 그대로 읽어야 한다.** 서명은 글자 하나까지 같은 문자열로
  // 계산된 것이라, JSON 으로 파싱했다가 다시 만들면 검증이 깨진다
  const raw = await req.text()

  let event
  try {
    event = await Webhook.verify(secret, raw, Object.fromEntries(req.headers))
  } catch {
    // 서명이 안 맞으면 남의 요청이다. 재전송받을 이유가 없다
    return Response.json({ ok: false, note: '서명 검증 실패' }, { status: 400 })
  }

  if (!('data' in event) || !event.data || !('paymentId' in event.data)) {
    return ok(`다루지 않는 종류 (${String(event.type)})`)
  }
  const paymentId = event.data.paymentId

  const admin = createAdminClient()
  const { data: order } = await admin
    .from('orders')
    .select('id, order_no, status, total_krw')
    .eq('payment_id', paymentId)
    .maybeSingle()

  // 우리 주문이 아니다. 실패가 아니라 남의 것이다
  if (!order) return ok(`모르는 결제 (${paymentId})`)

  switch (event.type) {
    // ── 결제됨 ────────────────────────────────────────────
    case 'Transaction.Paid': {
      if (order.status !== 'pending') {
        return ok(`이미 ${order.status} (${order.order_no})`)
      }

      // **본문의 말을 믿지 않는다.** 포트원에 직접 묻는다
      const payment = await getPayment(paymentId)
      if (!isPaid(payment, order.total_krw)) {
        return ok(`금액·상태가 맞지 않아 넘어감 (${order.order_no})`)
      }
      // 카드만 받는다 (portone.ts). **화면 쪽과 같은 판단을 한다** —
      // 한쪽만 막으면 그쪽을 피해 들어온다
      if (!isCard(payment)) {
        await cancelSafely(paymentId, '카드 결제만 받습니다')
        return ok(`카드가 아니라 취소 (${order.order_no})`)
      }

      const { error } = await admin.rpc('mark_order_paid', {
        p_order_id: order.id,
        p_provider: 'portone',
        p_payment_id: paymentId,
      })
      if (error) {
        // 재고가 모자란 경우가 대부분이다. **여기서도 돈을 돌려준다** —
        // 화면이 없는 경로라고 손님 돈을 들고 있을 수는 없다
        await cancelSafely(paymentId, '재고 부족')
        return ok(`완료하지 못해 취소: ${error.message} (${order.order_no})`)
      }
      return ok(`결제 완료 (${order.order_no})`)
    }

    // ── 취소됨 ────────────────────────────────────────────
    // 콘솔에서 환불하거나 우리 코드가 취소를 걸었을 때 둘 다 온다
    case 'Transaction.Cancelled': {
      const { error } = await admin.rpc('mark_order_cancelled', {
        p_order_id: order.id,
        p_reason: '결제 취소',
      })
      if (error) return ok(`취소 반영 실패: ${error.message}`)
      return ok(`취소 반영 (${order.order_no})`)
    }

    // ── 실패 ──────────────────────────────────────────────
    // **주문을 건드리지 않는다.** `pending` 으로 두어야 손님이 주문
    // 내역에서 다시 결제할 수 있다
    case 'Transaction.Failed':
      return ok(`결제 실패 — pending 유지 (${order.order_no})`)

    default:
      // 부분취소·가상계좌 발급 등. 지금은 다루지 않는다
      return ok(`다루지 않는 종류 (${String(event.type)})`)
  }
}
