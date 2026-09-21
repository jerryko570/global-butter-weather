import Link from 'next/link'
import { redirect } from 'next/navigation'
import Label from '@/components/Label'
import { formatKRW } from '@/lib/queries/products'
import { createClient } from '@/lib/supabase/server'
import type { Order, OrderItem } from '@/types/order'

/**
 * 주문 내역. **내 주문만 보인다.**
 *
 * 거르는 코드가 없는데 그런 이유는 RLS 다 — `orders_own` 이
 * `user_id = auth.uid()` 인 것만 돌려준다 (`0005_orders.sql`).
 * 화면이 권한을 판단하지 않는다.
 *
 * 주문번호를 잃어버려도 여기서 찾을 수 있다. 그것이 이 화면의 이유다.
 */
export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  pending: '결제 대기',
  paid: '결제 완료',
  shipped: '배송 중',
  done: '완료',
  cancelled: '취소됨',
}

/** 「그린가든 외 2건」 처럼 한 줄로 줄인다 */
function summarize(items: OrderItem[]): string {
  if (items.length === 0) return '상품 없음'
  const first = `${items[0].product_name} ${items[0].variant_name}`
  return items.length === 1 ? first : `${first} 외 ${items.length - 1}건`
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent('/orders')}`)
  }

  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .order('created_at', { ascending: false })

  const orders = (data ?? []) as (Order & { items: OrderItem[] })[]

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 px-7 py-5">
        <h1 className="text-ink text-title font-serif">주문 내역</h1>
        <Label>{orders.length}건</Label>
      </div>

      {orders.length === 0 ? (
        <div className="border-b border-gray-200 px-7 py-24 text-center">
          <p className="text-ink-muted text-body mb-8">아직 주문이 없습니다.</p>
          <Link
            href="/"
            className="bg-ink text-cloud text-caption px-7 py-3 tracking-widest uppercase"
          >
            상품 보러 가기
          </Link>
        </div>
      ) : (
        <div className="border-b border-gray-200">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.order_no}`}
              className="group flex items-center gap-4 border-b border-gray-200 px-7 py-5 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <Label className="mb-1">
                  {new Date(o.created_at).toLocaleDateString('ko-KR')}
                </Label>
                <p className="text-ink text-body group-hover:underline">
                  {o.order_no}
                </p>
                <p className="text-ink-subtle text-caption truncate">
                  {summarize(o.items)}
                </p>
              </div>

              <span className="text-caption text-ink-muted shrink-0 border border-gray-300 px-2 py-1">
                {STATUS_LABEL[o.status] ?? o.status}
              </span>

              <p className="text-ink text-body w-28 shrink-0 text-right font-medium">
                {formatKRW(o.total_krw)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
