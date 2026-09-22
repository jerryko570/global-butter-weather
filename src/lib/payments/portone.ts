import 'server-only'

/**
 * 포트원에 **직접 물어보는** 쪽. 옛 레포의 `payment.service.ts` 를 계승한다.
 *
 * ---
 *
 * ## 왜 서버가 다시 물어보는가 ★
 *
 * 결제 성공 신호는 **브라우저에서 온다.** 브라우저는 조작할 수 있다.
 * 결제하지 않고 「성공」만 보내면 공짜로 물건을 가져간다.
 *
 * 그래서 **돈의 출처에 서버가 직접 확인한다.** 상태가 `PAID` 이고
 * **금액이 우리가 저장해 둔 것과 정확히 같아야** 통과다 — 결제창에서
 * 금액이 바뀌는 경우를 막는다.
 *
 * ---
 *
 * ## 포트원은 PG 가 아니다
 *
 * 여러 PG 를 한 규격으로 묶는 층이다. **그래서 아래에 무엇을 붙이는지는
 * 콘솔에서 정하고 코드는 모른다** — `channelKey` 하나만 달라진다.
 *
 * 옛 사이트는 이 아래에 **KG이니시스**가 붙어 있었다(옛 코드 주석:
 * 「이니시스 V2는 email이 필수」). 결제창이 느렸던 것은 그쪽일 가능성이
 * 크다. 우리는 **토스페이먼츠 채널**로 시작한다 (2026-09-22 이나래 결정,
 * docs/plan/payment-providers.md).
 */

const API = 'https://api.portone.io'

/** 포트원 응답 중 우리가 쓰는 부분만 */
export type PortOnePayment = {
  status: 'PAID' | 'READY' | 'CANCELLED' | 'FAILED' | string
  amount: { total: number }
  currency: string
  /** `PaymentMethodCard` · `PaymentMethodEasyPay` 같은 값이 온다 */
  method?: { type?: string; provider?: string }
}

function secret(): string {
  const s = process.env.PORTONE_API_SECRET
  if (!s) {
    throw new Error(
      'PORTONE_API_SECRET 이 없습니다. Vercel 환경변수에 넣으세요 — ' +
        '브라우저로 나가면 안 되므로 NEXT_PUBLIC_ 을 붙이지 않습니다.'
    )
  }
  return s
}

/** 결제 한 건을 조회한다 */
export async function getPayment(paymentId: string): Promise<PortOnePayment> {
  const res = await fetch(`${API}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `PortOne ${secret()}` },
    // 결제 상태를 캐시하면 안 된다. 방금 바뀐 값을 봐야 한다
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`포트원 조회 실패 (${res.status})`)
  }
  return (await res.json()) as PortOnePayment
}

/**
 * 기대한 그대로 결제됐는가.
 *
 * **금액 비교를 빼지 말 것.** 상태만 보면 1원 결제하고 10만원짜리를
 * 가져갈 수 있다.
 */
export function isPaid(payment: PortOnePayment, expectedKrw: number): boolean {
  return (
    payment.status === 'PAID' &&
    payment.currency === 'KRW' &&
    payment.amount.total === expectedKrw
  )
}

/**
 * 카드로 결제됐는가. **카드만 받기로 했다 (2026-09-22).**
 *
 * 결제창에서 수단을 잠그는 방법이 없다 — `payMethod: 'CARD'` 는 **기본
 * 선택**일 뿐이고 간편결제 탭이 그대로 열린다. 그래서 **받은 뒤에 서버가
 * 거른다.**
 *
 * 이게 왜 필요한가. 포트원 공용 테스트 상점(`iamporttest_3`)은 PG 쪽은
 * 가짜지만 **간편결제사는 자기 쪽에서 실거래로 처리한다.** 2026-09-22에
 * 카카오페이머니로 26,800원이 실제로 빠져나갔다. 테스트인데 돈이 나간다.
 *
 * 실연동에서는 **계약한 수단만 결제창에 뜨므로** 카드만 계약하면 이 검사가
 * 걸릴 일이 없다. 그래도 남겨둔다 — 계약이 늘어나는 날 이 줄이 유일한 방어다.
 */
export function isCard(payment: PortOnePayment): boolean {
  return payment.method?.type === 'PaymentMethodCard'
}

/**
 * 결제를 취소한다. **금액이 안 맞을 때 되돌리는 용도다.**
 *
 * 손님 돈이 빠져나갔는데 주문은 완료되지 않은 상태를 남기지 않는다.
 */
export async function cancelPayment(
  paymentId: string,
  reason: string
): Promise<void> {
  const res = await fetch(
    `${API}/payments/${encodeURIComponent(paymentId)}/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: `PortOne ${secret()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    }
  )

  if (!res.ok) {
    // 취소까지 실패하면 사람이 봐야 한다. 조용히 넘기면 손님 돈이
    // 묶인 채로 아무도 모른다
    throw new Error(`포트원 취소 실패 (${res.status}) — paymentId ${paymentId}`)
  }
}
