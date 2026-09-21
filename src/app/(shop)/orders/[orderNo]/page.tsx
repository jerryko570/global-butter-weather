import Link from 'next/link'
import { notFound } from 'next/navigation'
import Label from '@/components/Label'
import { formatKRW } from '@/lib/queries/products'
import { createClient } from '@/lib/supabase/server'
import type { OrderItem, ShippingInfo } from '@/types/order'

/**
 * 주문 하나. 주문서를 만들고 나면 여기로 온다.
 *
 * **남의 주문은 보이지 않는다.** 거르는 코드가 없는데 그런 이유는 RLS 가
 * 막기 때문이다 — `orders_own` 이 `user_id = auth.uid()` 인 것만 돌려준다
 * (`0005_orders.sql`). 그래서 남의 주문번호를 알아도 404 가 된다.
 *
 * 주소가 주문번호(`260919-0007`)인 것은 손님이 부를 수 있는 값이기
 * 때문이다. uuid 는 전화로 불러줄 수 없다 (schema.md 7-3절).
 */
export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  pending: '결제 대기',
  paid: '결제 완료',
  shipped: '배송 중',
  done: '완료',
  cancelled: '취소됨',
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNo: string }>
}) {
  const { orderNo } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('order_no', decodeURIComponent(orderNo))
    .maybeSingle()

  if (!data) notFound()

  const shipping = data.shipping_info as ShippingInfo
  const items = (data.items ?? []) as OrderItem[]

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 px-7 py-5">
        <h1 className="text-ink text-title font-serif">주문 완료</h1>
        <Label>{STATUS_LABEL[data.status] ?? data.status}</Label>
      </div>

      <div className="border-b border-gray-200 px-7 py-10 text-center">
        <Label className="mb-3">주문번호</Label>
        <p className="text-ink text-display font-serif tracking-wider">
          {data.order_no}
        </p>
        <p className="text-ink-muted text-caption mt-4 leading-relaxed">
          주문서가 만들어졌습니다. <strong>아직 결제는 되지 않았습니다.</strong>
          <br />
          결제가 준비되는 대로 이 번호로 이어서 진행됩니다.
        </p>
      </div>

      <div className="grid grid-cols-1 border-b border-gray-200 lg:grid-cols-2">
        {/* ───── 주문 상품 ───── */}
        <div className="border-b border-gray-200 p-8 lg:border-r lg:border-b-0 lg:p-12">
          <h2 className="text-ink text-title mb-6 font-serif">주문 상품</h2>
          {items.map((i) => (
            <div
              key={i.id}
              className="flex items-baseline justify-between border-t border-gray-200 py-3"
            >
              <div className="min-w-0">
                <p className="text-ink text-caption truncate">
                  {i.product_name}
                </p>
                <p className="text-ink-subtle text-caption">
                  {i.variant_name} · {i.quantity}개
                </p>
              </div>
              <p className="text-ink text-caption shrink-0">
                {formatKRW(i.price_krw * i.quantity)}
              </p>
            </div>
          ))}
          <div className="flex items-baseline justify-between border-t border-gray-200 pt-4">
            <Label>Total</Label>
            <p className="text-ink text-title font-medium">
              {formatKRW(data.total_krw)}
            </p>
          </div>
        </div>

        {/* ───── 배송지 ───── */}
        <div className="p-8 lg:p-12">
          <h2 className="text-ink text-title mb-6 font-serif">배송지</h2>
          <dl className="flex flex-col">
            {[
              ['받는 분', shipping.name],
              ['연락처', shipping.phone],
              [
                '주소',
                `(${shipping.zipcode}) ${shipping.address} ${shipping.addressDetail}`.trim(),
              ],
              ['배송 메모', shipping.memo || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-6 border-t border-gray-200 py-3">
                <dt className="text-ink-subtle text-caption w-20 shrink-0">
                  {k}
                </dt>
                <dd className="text-ink-muted text-caption">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="border-b border-gray-200 px-7 py-8 text-center">
        <Link
          href="/"
          className="text-ink border-ink hover:text-ink-muted text-caption inline-block border-b pb-0.5 tracking-widest uppercase"
        >
          계속 둘러보기
        </Link>
      </div>
    </>
  )
}
