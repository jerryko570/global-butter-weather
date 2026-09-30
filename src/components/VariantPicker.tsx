'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Label from '@/components/Label'
import { useToast } from '@/components/Toast'
import { formatKRW } from '@/lib/queries/products'
import { useCart } from '@/lib/store/cart'
import type { ProductDetail, ProductVariant } from '@/types/product'

/**
 * 옵션·수량을 고르고 사는 자리.
 *
 * 순서는 옛 레포를 따른다 — **가격 → 구분선 → 옵션 → 수량 → 합계 → 버튼**.
 * 옛 쪽에는 옵션이 없었고(가격이 상품에 붙어 있었다) 수량만 있었다.
 * 옵션이 그 위에 한 층 더 붙은 꼴이다.
 *
 * **가격은 고른 옵션의 것이다.** 목록은 「얼마부터」였지만 여기서는 고른
 * 것 하나의 값이다 (schema.md 1절 — 가격은 옵션에 붙어 있다).
 *
 * 처음 고르는 것은 **재고가 있는 첫 옵션**이다. 품절인 것이 먼저 잡혀
 * 살 수 없는 화면으로 열리지 않게 한다.
 *
 * **「장바구니 담기」는 실제로 담는다.** 담는 것은 브라우저 안의 일이라
 * 로그인도 서버도 필요 없다 (`lib/store/cart.ts`).
 *
 * 옛 사이트는 장바구니 없이 **바로 결제**였다. 이번에는 둘 다 둔다.
 *
 * ---
 *
 * ## 버튼은 한국어다 (2026-09-30 이나래 확정) ★
 *
 * `Add to Cart` · `Buy It Now` · `Sold Out` 이었다. **버튼은 「말」이므로
 * 언어를 따라간다** — 규약은 [writing.md](../../docs/design/writing.md) 1절.
 *
 * `uppercase` 는 **그대로 둔다.** 한글에는 아무 효과가 없지만 죽은 값이
 * 아니다 — EN 버전이 열리면 같은 자리에 영문이 들어오고 그때 필요하다.
 */
export default function VariantPicker({
  product,
  variants,
}: {
  product: ProductDetail
  variants: ProductVariant[]
}) {
  const router = useRouter()
  const { show } = useToast()
  const add = useCart((s) => s.add)
  const firstInStock = variants.findIndex((v) => v.stock > 0)
  const [selected, setSelected] = useState(
    firstInStock === -1 ? 0 : firstInStock
  )
  const [quantity, setQuantity] = useState(1)

  const variant = variants[selected]
  const soldOut = variant.stock === 0

  // 옵션을 바꾸면 수량을 1로 되돌린다. 재고 5개짜리에서 5를 고른 뒤
  // 재고 1개짜리로 옮기면 살 수 없는 수량이 남는다.
  function pick(i: number) {
    setSelected(i)
    setQuantity(1)
  }

  /** 담기만 한다. 담고 나서 어디로 갈지는 부르는 쪽이 정한다 */
  function put() {
    add(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        // **보여주기 위한 사본이다.** 영수증의 숫자는 주문할 때 서버가
        // DB 에서 다시 읽는다 (lib/store/cart.ts)
        productName: product.name,
        variantName: variant.name,
        priceKrw: variant.price_krw,
        image: product.images[0] ?? null,
        stock: variant.stock,
      },
      quantity
    )
  }

  function addToCart() {
    put()
    show(`장바구니에 담았습니다 — ${variant.name} ${quantity}개`)
    // 담고 나서 화면을 옮기지 않는다. 다른 옵션도 담을 수 있어야 한다.
    // 대신 위쪽 Cart 숫자가 바로 올라간다
    router.refresh()
  }

  /**
   * 바로구매. **이것만 산다.**
   *
   * ⚠️ **장바구니를 건드리지 않는다.** 처음에는 담고 주문서로 보냈는데,
   * 그러면 **담아둔 다른 것이 같이 결제된다.** 키링 두 개를 나중에 사려고
   * 담아뒀는데 목걸이 하나만 급히 사려다 셋 다 결제되는 식이다.
   * 「바로구매」라는 말은 장바구니를 거치지 않겠다는 뜻이다 (2026-09-30).
   *
   * **상태를 새로 만들지 않고 주소에 싣는다.** 남아서 썩는 상태가 없고,
   * 새로고침해도 그대로다. 상품 정보는 주문서가 서버에서 다시 읽는다 —
   * 화면이 들고 가면 그것도 또 하나의 사본이 된다.
   */
  function buyNow() {
    router.push(`/checkout?buy=${variant.id}&qty=${quantity}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-ink text-title font-medium">
        {formatKRW(variant.price_krw)}
      </p>

      <div className="border-t border-gray-200" />

      {/* 옵션이 하나뿐이면 고를 것이 없다 */}
      {variants.length > 1 ? (
        <div>
          <Label className="mb-3">옵션</Label>
          <div className="flex flex-wrap gap-2">
            {variants.map((v, i) => {
              const out = v.stock === 0
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={out}
                  onClick={() => pick(i)}
                  aria-pressed={i === selected}
                  className={`text-caption border px-5 py-2.5 transition-colors ${
                    out
                      ? 'text-ink-subtle cursor-not-allowed border-gray-200 line-through'
                      : i === selected
                        ? 'border-ink bg-ink text-cloud'
                        : 'text-ink hover:border-ink border-gray-300'
                  }`}
                >
                  {v.name}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* 수량 — 옛 레포의 − 1 + 그대로다. 재고를 넘지 못한다 */}
      <div className="flex items-center gap-3">
        <Label>수량</Label>
        <button
          type="button"
          disabled={soldOut || quantity <= 1}
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          aria-label="수량 줄이기"
          className="text-ink-muted hover:border-ink flex h-8 w-8 items-center justify-center border border-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <span className="text-ink text-caption w-6 text-center">
          {quantity}
        </span>
        <button
          type="button"
          disabled={soldOut || quantity >= variant.stock}
          onClick={() => setQuantity((q) => Math.min(variant.stock, q + 1))}
          aria-label="수량 늘리기"
          className="text-ink-muted hover:border-ink flex h-8 w-8 items-center justify-center border border-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
        <span className="text-ink-subtle text-caption">
          {soldOut ? '품절' : `재고 ${variant.stock}개`}
        </span>
      </div>

      {/* 합계 */}
      <div className="flex items-baseline justify-between border-t border-gray-200 pt-4">
        <Label>합계</Label>
        <p className="text-ink text-title font-medium">
          {formatKRW(variant.price_krw * quantity)}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={addToCart}
          disabled={soldOut}
          className="text-ink hover:border-ink text-caption w-full border border-gray-300 py-3.5 tracking-widest uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          장바구니 담기
        </button>
        <button
          type="button"
          onClick={buyNow}
          disabled={soldOut}
          className="bg-ink text-cloud text-caption w-full py-3.5 tracking-widest uppercase disabled:cursor-not-allowed disabled:opacity-40"
        >
          {soldOut ? '품절' : '바로 구매'}
        </button>
      </div>
    </div>
  )
}
