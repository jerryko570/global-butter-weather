import 'server-only'

/**
 * `mark_order_paid()` 가 실패했을 때 **취소를 걸지 말지**를 가른다.
 *
 * ---
 *
 * ## 왜 따로 떼어냈나 ★
 *
 * 부르는 곳이 둘이다 — 브라우저가 돌아왔을 때(`checkout/payment.ts`)와
 * 웹훅이 왔을 때(`api/payments/webhook`). **둘이 다르게 판단하면 한쪽을
 * 피해 들어온다.** 그래서 판단을 한 군데에 둔다.
 *
 * ---
 *
 * ## 2026-09-23에 멀쩡한 결제가 취소됐다 ★
 *
 * 웹훅이 붙으면서 두 경로가 **같은 주문을 동시에 끝내려** 하게 됐다.
 * 먼저 온 쪽이 `paid` 로 바꾸면 나중 쪽은 `ORDER_NOT_PENDING` 을 받는데,
 * 그때 「실패했으니 돈을 돌려준다」로 처리하고 있었다. 실제 순서다.
 *
 * ```
 * 04:29:00  포트원 결제 승인
 * 04:29:03  한쪽이 paid 로 바꾼다 — 재고가 깎인다
 * 04:29:04  다른 쪽이 ORDER_NOT_PENDING 을 받고 「재고 부족」으로 취소
 * 04:29:05  주문 cancelled — 재고가 되돌아온다
 * ```
 *
 * **이미 끝났다는 말은 실패가 아니다.** 오히려 성공이다.
 *
 * ---
 *
 * ## 모르는 실패에는 돈을 돌려주지 않는다 ★
 *
 * 전에는 알 수 없는 오류도 전부 취소했다. 그러면 **DB가 잠깐 끊긴 것**
 * 같은 일시적인 문제에 손님 결제가 취소된다. 되돌릴 수 없는 쪽으로
 * 기울면 안 된다.
 *
 * 취소는 **다시 해봐야 소용없는 것**에만 건다 — 재고가 없거나 옵션이
 * 사라진 경우다. 그 밖에는 결제를 그대로 두고 포트원의 재전송(최대 5회)
 * 이나 손님의 「다시 결제」를 기다린다.
 */
export type PaidFailure =
  /** 이미 다른 경로가 끝냈다. **취소하지 않는다** */
  | { kind: 'already' }
  /** 재고가 없거나 옵션이 사라졌다. 다시 해도 안 된다 — 취소한다 */
  | { kind: 'stock'; detail: string }
  /** 알 수 없다. 일시적일 수 있으므로 **취소하지 않는다** */
  | { kind: 'unknown'; message: string }

export function classifyPaidError(message: string): PaidFailure {
  if (message.includes('ORDER_NOT_PENDING')) return { kind: 'already' }

  if (message.includes('OUT_OF_STOCK')) {
    const [, detail] = message.split('OUT_OF_STOCK:')
    return { kind: 'stock', detail: (detail ?? '').trim() || '일부 상품' }
  }
  if (message.includes('VARIANT_GONE')) {
    return { kind: 'stock', detail: '판매가 끝난 상품' }
  }
  return { kind: 'unknown', message }
}
