import { redirect } from 'next/navigation'

/** 지금 어드민이 하는 일은 상품 관리뿐이다. 주문은 M3 다 */
export default function AdminHome() {
  redirect('/admin/products')
}
