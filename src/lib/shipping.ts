/**
 * 배송비 규칙. **여기 한 군데에서만 센다.**
 *
 * 화면과 서버가 따로 세면 어긋난다 — 손님에게 보여준 금액과 실제로
 * 저장되는 금액이 달라지는 것은 그대로 분쟁이다. 그래서 같은 함수를
 * 양쪽이 부른다. **다만 저장되는 값은 서버가 센 것이다** (schema.md 7-3절).
 *
 * ---
 *
 * ## 3,000원에서 3,500원으로 (2026-09-27) ★
 *
 * 처음 값은 옛 버터웨더 사이트에 걸려 있던 것을 그대로 가져온 것이었다
 * (2026-09-19 이나래 확인). **그런데 원가를 재 보니 모자랐다.**
 *
 * 문앞 배송으로 가기로 했고(반값택배를 쓰지 않는다), 그 조건에서 가장 싼
 * **GS 포스트너가 2kg 이하 3,200~3,400원**이다. 3,000원을 받으면 한 건마다
 * 손해가 나고 포장재는 세지도 않은 값이다.
 *
 * 근거는 [shipping-providers.md](../../docs/plan/shipping-providers.md).
 *
 * **무료 기준 50,000원은 그대로 둔다.** 키링이 11,900원이라 대부분의
 * 주문은 여기 닿지 않는다 — 사실상 거의 모든 주문에서 배송비를 받는다.
 * 그 숫자를 낮출지는 아직 정해지지 않았다.
 */

/**
 * 기본 배송비. **원가(3,200~3,400원)보다 낮게 두지 말 것.**
 *
 * 이 값을 바꾸면 상세 화면의 `Shipping & Returns` 탭도 같이 바뀐다 —
 * `ProductTabs` 가 이 상수를 읽는다. 두 군데에 적어 두면 반드시 어긋난다.
 */
export const SHIPPING_FEE_KRW = 3500

/**
 * 이 금액 이상이면 무료. **상품 합계 기준이다** — 배송비를 더한 값으로
 * 판정하면 「배송비 때문에 무료가 되는」 이상한 일이 생긴다.
 */
export const FREE_SHIPPING_OVER_KRW = 50000

export function shippingFee(itemsKrw: number): number {
  if (itemsKrw <= 0) return 0
  return itemsKrw >= FREE_SHIPPING_OVER_KRW ? 0 : SHIPPING_FEE_KRW
}

/** 무료까지 얼마 남았는지. 0 이면 이미 무료다 */
export function amountUntilFreeShipping(itemsKrw: number): number {
  return Math.max(0, FREE_SHIPPING_OVER_KRW - itemsKrw)
}
