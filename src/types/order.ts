/**
 * 주문 타입. **`supabase/migrations/0005_orders.sql` 과 1:1로 맞춘다.**
 * 스키마를 고치면 이 파일도 같이 고칠 것.
 *
 * 설계 근거는 docs/dev/schema.md 7-3절.
 */

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'done' | 'cancelled'

/** 배송지. 회원 정보가 아니라 **주문마다 받는다** */
export interface ShippingInfo {
  name: string
  phone: string
  zipcode: string
  address: string
  /** 상세 주소 — 동·호수처럼 뒤에 붙는 것 */
  addressDetail: string
  /** 배송 메모. 없으면 빈 문자열 */
  memo: string
}

/** 「영수증 표지」 */
export interface Order {
  id: string
  /** 사람이 부르는 번호. `260919-0007` */
  order_no: string
  user_id: string
  status: OrderStatus
  /** 상품 합계. 배송비 판정의 기준 */
  items_krw: number
  /** 주문 시점의 배송비. **규칙이 바뀌어도 이 값은 그대로다** */
  shipping_fee_krw: number
  /** 손님이 내는 총액 = items_krw + shipping_fee_krw */
  total_krw: number
  currency: string
  shipping_info: ShippingInfo
  agree_privacy: boolean
  agree_marketing: boolean
  payment_provider: string | null
  payment_id: string | null
  paid_at: string | null
  /** 취소된 시각. `0007` 에서 붙었다 */
  cancelled_at: string | null
  /** 왜 취소했나. 웹훅이면 「결제 취소」, 관리자면 적은 사유 */
  cancel_reason: string | null
  created_at: string
  updated_at: string
}

/**
 * 「영수증의 줄」. **아래 셋은 주문 시점의 박제다** — 상품이 바뀌어도
 * 영수증은 그대로다 (schema.md 7-3절).
 */
export interface OrderItem {
  id: string
  order_id: string
  /** 상품이 지워지면 null 이 된다. 그때 그 상품은 아래 박제가 말해 준다 */
  product_id: string | null
  variant_id: string | null
  product_name: string
  variant_name: string
  price_krw: number
  quantity: number
  created_at: string
}

export interface OrderDetail extends Order {
  items: OrderItem[]
}

/**
 * 화면이 서버로 보내는 것. **가격이 없다.**
 *
 * 값은 서버가 DB 에서 다시 읽는다 — 장바구니가 보낸 가격을 믿으면
 * 11,900원짜리를 100원에 살 수 있다 (`lib/queries/orders.ts`).
 */
export interface OrderLineInput {
  variantId: string
  quantity: number
}
