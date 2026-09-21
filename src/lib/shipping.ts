/**
 * 배송비 규칙. **여기 한 군데에서만 센다.**
 *
 * 화면과 서버가 따로 세면 어긋난다 — 손님에게 보여준 금액과 실제로
 * 저장되는 금액이 달라지는 것은 그대로 분쟁이다. 그래서 같은 함수를
 * 양쪽이 부른다. **다만 저장되는 값은 서버가 센 것이다** (schema.md 7-3절).
 *
 * 값은 옛 버터웨더 사이트에 실제로 걸려 있던 것이다 (2026-09-19 이나래
 * 확인). 상세 화면의 `Shipping & Returns` 탭에 보이는 것과 같아야 한다.
 */

/** 기본 배송비 */
export const SHIPPING_FEE_KRW = 3000

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
