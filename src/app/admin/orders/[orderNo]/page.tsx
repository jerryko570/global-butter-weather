import Link from 'next/link'
import { notFound } from 'next/navigation'
import Label from '@/components/Label'
import CancelOrderButton from '@/components/admin/CancelOrderButton'
import { ORDER_STATUS_LABEL, krw } from '@/lib/orders'
import { createClient } from '@/lib/supabase/server'
import type { Order, OrderItem } from '@/types/order'

/**
 * 주문 하나. **관리자가 보는 쪽이라 손님 화면보다 많이 보여준다** —
 * 결제 번호와 취소 사유까지.
 *
 * ⚠️ **관리자가 아니면 자기 주문만 열린다.** RLS 가 가른다 (`0005`).
 */
export const dynamic = 'force-dynamic'

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ orderNo: string }>
}) {
  const { orderNo } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('order_no', orderNo)
    .maybeSingle()

  if (!data) notFound()
  const order = data as Order & {
    items: OrderItem[]
    cancelled_at: string | null
    cancel_reason: string | null
  }

  const canCancel = order.status === 'pending' || order.status === 'paid'

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/admin/orders"
          className="text-ink-subtle hover:text-ink text-caption"
        >
          ← 주문 목록
        </Link>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <h1 className="text-ink text-title font-serif">{order.order_no}</h1>
            <p className="text-ink-subtle text-caption mt-1">
              {new Date(order.created_at).toLocaleString('ko-KR')}
            </p>
          </div>
          <span className="text-caption text-ink-muted border border-gray-300 px-2 py-1">
            {ORDER_STATUS_LABEL[order.status]}
          </span>
        </div>
      </div>

      {order.status === 'cancelled' && order.cancel_reason ? (
        <div className="border border-gray-200 p-4">
          <Label className="mb-1">취소 사유</Label>
          <p className="text-ink text-body">{order.cancel_reason}</p>
          {order.cancelled_at ? (
            <p className="text-ink-subtle text-caption mt-1">
              {new Date(order.cancelled_at).toLocaleString('ko-KR')}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* ── 주문 상품 ─────────────────────────────────────── */}
      <section>
        <Label className="mb-3">주문 상품</Label>
        <div className="border-t border-gray-200">
          {order.items.map((it) => (
            <div
              key={it.id}
              className="flex items-start justify-between gap-4 border-b border-gray-200 py-3"
            >
              <div className="min-w-0">
                <p className="text-ink text-body">{it.product_name}</p>
                <p className="text-ink-subtle text-caption">
                  {it.variant_name} · {it.quantity}개
                </p>
              </div>
              <span className="text-ink text-body shrink-0">
                ₩{krw(it.price_krw * it.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <div className="text-ink-muted text-caption flex justify-between">
            <span>상품</span>
            <span>₩{krw(order.items_krw)}</span>
          </div>
          <div className="text-ink-muted text-caption flex justify-between">
            <span>배송비</span>
            <span>₩{krw(order.shipping_fee_krw)}</span>
          </div>
          <div className="text-ink text-body mt-1 flex justify-between font-serif">
            <span>TOTAL</span>
            <span>₩{krw(order.total_krw)}</span>
          </div>
        </div>
      </section>

      {/* ── 배송지 ────────────────────────────────────────── */}
      <section>
        <Label className="mb-3">배송지</Label>
        <dl className="border-t border-gray-200">
          {[
            ['받는 분', order.shipping_info.name],
            ['연락처', order.shipping_info.phone],
            [
              '주소',
              `(${order.shipping_info.zipcode}) ${order.shipping_info.address} ${order.shipping_info.addressDetail}`,
            ],
            ['배송 메모', order.shipping_info.memo || '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-4 border-b border-gray-200 py-3">
              <dt className="text-ink-subtle text-caption w-24 shrink-0">
                {k}
              </dt>
              <dd className="text-ink text-body">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── 결제 ──────────────────────────────────────────── */}
      <section>
        <Label className="mb-3">결제</Label>
        <dl className="border-t border-gray-200">
          {[
            ['결제사', order.payment_provider ?? '—'],
            ['결제 번호', order.payment_id ?? '—'],
            [
              '결제 시각',
              order.paid_at
                ? new Date(order.paid_at).toLocaleString('ko-KR')
                : '—',
            ],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-4 border-b border-gray-200 py-3">
              <dt className="text-ink-subtle text-caption w-24 shrink-0">
                {k}
              </dt>
              <dd className="text-ink text-caption break-all">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <CancelOrderButton orderNo={order.order_no} canCancel={canCancel} />
    </div>
  )
}
