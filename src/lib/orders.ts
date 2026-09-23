import type { OrderStatus } from '@/types/order'

/**
 * 주문 상태를 사람 말로. **화면마다 다르게 부르지 않기 위해** 한 군데에 둔다.
 *
 * `status` 는 「판매의 진행」이지 「노출」이 아니다 (schema.md 7-3절).
 */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: '결제 대기',
  paid: '결제 완료',
  shipped: '배송 중',
  done: '완료',
  cancelled: '취소됨',
}

/** 원 단위 정수를 `14,900` 으로 */
export function krw(n: number): string {
  return n.toLocaleString('ko-KR')
}
