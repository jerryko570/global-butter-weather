import Link from 'next/link'
import Label from '@/components/Label'
import { ORDER_STATUS_LABEL, krw } from '@/lib/orders'
import { createClient } from '@/lib/supabase/server'
import type { Order, OrderItem } from '@/types/order'

/**
 * 주문 목록. **server component 다** — 상품 목록과 같은 이유다.
 *
 * ⚠️ **관리자가 아니면 자기 주문만 보인다.** 거르는 코드가 없는데 나뉘는
 * 이유는 RLS 다 — `orders_admin_all` 이 관리자에게 전부 열어주고, 아니면
 * `orders_own` 이 자기 것만 준다 (`0005`).
 *
 * 그래서 「주문이 없다」가 두 가지 뜻이 된다. 화면이 그 차이를 말해 준다.
 */

/** 로그인 상태에 따라 결과가 달라지므로 굽어 두면 안 된다 */
export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .order('created_at', { ascending: false })

  const orders = (data ?? []) as (Order & { items: OrderItem[] })[]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-ink text-title font-serif">주문</h1>
        <p className="text-ink-subtle text-caption mt-1">{orders.length}건</p>
      </div>

      {error ? (
        <p className="text-caption border border-red-200 bg-red-50 p-3 text-red-600">
          불러오지 못했습니다 — {error.message}
        </p>
      ) : null}

      {orders.length === 0 ? (
        <div className="border border-gray-200 px-6 py-16 text-center">
          <p className="text-ink-muted text-body">주문이 없습니다.</p>
          <p className="text-ink-subtle text-caption mt-2">
            남의 주문이 안 보인다면 관리자로 로그인하지 않은 것입니다.
          </p>
        </div>
      ) : (
        <div className="border-t border-gray-200">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.order_no}`}
              className="flex items-center gap-4 border-b border-gray-200 py-4 hover:bg-gray-50"
            >
              <div className="min-w-0 flex-1">
                <Label className="mb-1">
                  {new Date(o.created_at).toLocaleString('ko-KR')}
                </Label>
                <p className="text-ink text-body">{o.order_no}</p>
                <p className="text-ink-subtle text-caption truncate">
                  {o.shipping_info.name} · {o.items.length}종
                </p>
              </div>

              <span className="text-ink text-body shrink-0">
                ₩{krw(o.total_krw)}
              </span>

              <span
                className={`text-caption shrink-0 border px-2 py-1 ${
                  o.status === 'cancelled'
                    ? 'text-ink-subtle border-gray-200'
                    : 'text-ink-muted border-gray-300'
                }`}
              >
                {ORDER_STATUS_LABEL[o.status]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
