'use server'

import { createClient } from '@/lib/supabase/server'
import { shippingFee } from '@/lib/shipping'
import type { OrderLineInput, ShippingInfo } from '@/types/order'

/**
 * 주문을 만든다. **서버에서만 만든다.**
 *
 * ---
 *
 * ## 왜 서버여야 하는가 ★
 *
 * RLS 는 **「누구의 주문인가」만 보고 「얼마인가」는 보지 않는다.**
 * `orders_insert_own` 은 `user_id = auth.uid()` 만 검사한다.
 *
 * 그래서 화면이 직접 넣게 두면 **손님이 값을 정하게 된다** — 11,900원짜리를
 * `price_krw: 100` 으로 보내면 그대로 들어간다. 장바구니가 브라우저에
 * 있으니 고치는 것도 쉽다.
 *
 * **화면은 「어느 옵션을 몇 개」만 보낸다.** 이름도 가격도 서버가 DB 에서
 * 다시 읽어 박제한다 (schema.md 7-3절).
 *
 * ---
 *
 * ## 여기서 재고를 깎지 않는다
 *
 * 주문은 `pending` 으로 만든다. **재고는 결제가 끝날 때 `mark_order_paid()`
 * 가 깎는다** (2026-09-19 이나래 확정, schema.md 7-3절).
 *
 * 다만 **살 수 없는 것을 주문서로 만들지는 않는다** — 담는 사이에 품절이
 * 됐을 수 있어 여기서 한 번 본다. 이건 「막는 것」이 아니라 「알려주는
 * 것」이다. 진짜 판정은 결제 때다.
 */

export type CreateOrderResult =
  | { ok: true; orderNo: string }
  | {
      ok: false
      reason: string
      /**
       * 더 이상 살 수 없는 줄. **화면이 이것으로 이름을 붙여 보여준다** —
       * 서버는 상품 이름을 모르는 경우가 있다(조회 자체가 안 되는 줄).
       */
      goneVariantIds?: string[]
    }

export async function createOrder(
  lines: OrderLineInput[],
  shipping: ShippingInfo,
  agreeMarketing: boolean
): Promise<CreateOrderResult> {
  const supabase = await createClient()

  // ── 1. 누구인가 ───────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, reason: '로그인이 필요합니다.' }
  }

  // ── 2. 보낸 것이 말이 되는가 ──────────────────────────────
  if (lines.length === 0) {
    return { ok: false, reason: '담긴 것이 없습니다.' }
  }
  if (lines.some((l) => !Number.isInteger(l.quantity) || l.quantity < 1)) {
    return { ok: false, reason: '수량이 올바르지 않습니다.' }
  }
  // 같은 옵션이 두 줄로 오면 합계가 어긋난다. 화면이 막지만 여기서도 본다
  const ids = lines.map((l) => l.variantId)
  if (new Set(ids).size !== ids.length) {
    return { ok: false, reason: '같은 옵션이 두 번 담겼습니다.' }
  }

  const need =
    shipping.name.trim() && shipping.phone.trim() && shipping.address.trim()
  if (!need) {
    return { ok: false, reason: '받는 분·연락처·주소를 채워 주세요.' }
  }

  // ── 3. 값을 DB 에서 다시 읽는다 ★ ─────────────────────────
  // **화면이 보낸 가격을 쓰지 않는다.** 여기가 이 파일의 이유다.
  const { data: variants, error: readError } = await supabase
    .from('product_variants')
    .select('id, name, price_krw, stock, product_id, products(name, is_active)')
    .in('id', ids)

  if (readError) {
    return { ok: false, reason: '상품을 확인하지 못했습니다.' }
  }

  type Row = {
    id: string
    name: string
    price_krw: number
    stock: number
    product_id: string
    products: { name: string; is_active: boolean } | null
  }
  const rows = (variants ?? []) as unknown as Row[]

  const byId = new Map(rows.map((r) => [r.id, r]))

  // 담은 뒤에 상품이 내려갔거나 **옵션이 새로 만들어졌을 수 있다.**
  // 어드민에서 상품을 고치면 옵션을 지우고 다시 넣으므로 id 가 바뀐다
  // (adminProducts.replaceVariants). 그러면 장바구니의 옛 id 는 가리키는
  // 데가 없어진다 — 2026-09-22에 실제로 그랬다.
  //
  // **어느 줄인지 돌려준다.** 「상품이 있습니다」로만 말하면 손님은
  // 장바구니를 통째로 비우는 수밖에 없다.
  const gone = ids.filter((id) => !byId.has(id))
  if (gone.length > 0) {
    return {
      ok: false,
      reason: '더 이상 살 수 없는 상품이 있습니다.',
      goneVariantIds: gone,
    }
  }

  // ── 4. 지금 살 수 있는가 ──────────────────────────────────
  for (const line of lines) {
    const v = byId.get(line.variantId)!
    if (!v.products?.is_active) {
      return {
        ok: false,
        reason: `${v.products?.name ?? '상품'} 은(는) 지금 살 수 없습니다.`,
      }
    }
    if (v.stock < line.quantity) {
      return {
        ok: false,
        reason:
          v.stock === 0
            ? `${v.products.name} ${v.name} 이(가) 품절됐습니다.`
            : `${v.products.name} ${v.name} 은(는) ${v.stock}개까지 가능합니다.`,
      }
    }
  }

  // ── 5. 합계도 서버가 센다 ─────────────────────────────────
  const items = lines.map((line) => {
    const v = byId.get(line.variantId)!
    return {
      product_id: v.product_id,
      variant_id: v.id,
      // 📸 박제 — 이 뒤로 상품이 바뀌어도 영수증은 그대로다
      product_name: v.products!.name,
      variant_name: v.name,
      price_krw: v.price_krw,
      quantity: line.quantity,
    }
  })

  const itemsKrw = items.reduce((sum, i) => sum + i.price_krw * i.quantity, 0)

  // **배송비도 서버가 센다.** 화면이 보여준 값을 받지 않는다 — 가격과
  // 같은 이유다. 규칙은 lib/shipping.ts 한 군데에만 있다
  const shippingKrw = shippingFee(itemsKrw)
  const total = itemsKrw + shippingKrw

  // ── 6. 넣는다 ─────────────────────────────────────────────
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      status: 'pending',
      items_krw: itemsKrw,
      shipping_fee_krw: shippingKrw,
      // 손님이 내는 총액이다. 상품 합계가 아니다
      total_krw: total,
      shipping_info: shipping,
      // 전자상거래법상 필수라 DB 가 `check (agree_privacy)` 로 막는다.
      // 여기까지 왔다는 것은 화면에서 체크했다는 뜻이다
      agree_privacy: true,
      agree_marketing: agreeMarketing,
    })
    .select('id, order_no')
    .single()

  if (orderError || !order) {
    return { ok: false, reason: '주문서를 만들지 못했습니다.' }
  }

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(items.map((i) => ({ ...i, order_id: order.id })))

  if (itemsError) {
    // 줄 없는 영수증이 남으면 목록에서 0원짜리로 보인다. 되돌린다.
    // **트랜잭션이 아니라서 지우는 것도 실패할 수 있다** — 그때는 pending
    // 으로 남지만, 결제가 안 됐으므로 손님에게 청구되지 않는다
    await supabase.from('orders').delete().eq('id', order.id)
    return { ok: false, reason: '주문 상품을 저장하지 못했습니다.' }
  }

  return { ok: true, orderNo: order.order_no as string }
}
