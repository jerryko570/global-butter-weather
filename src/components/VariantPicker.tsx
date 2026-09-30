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
 * **`Add to Cart` 는 실제로 담는다.** 담는 것은 브라우저 안의 일이라
 * 로그인도 서버도 필요 없다 (`lib/store/cart.ts`).
 *
 * ⚠️ **`Buy It Now` 는 아직 눌리지 않는다.** 주문서와 결제가 I3.3 이다.
 * 자리만 잡아두고 안내를 함께 둔다 — 눌러도 아무 일이 없는 버튼보다 왜
 * 안 되는지 보이는 편이 낫다 (2026-09-19 이나래 확인).
 *
 * 옛 사이트는 장바구니 없이 **바로 결제**였다. 이번에는 둘 다 둔다.
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
   * 바로구매. **담고 주문서로 바로 간다.**
   *
   * 결제를 붙이기 전에 잠가뒀던 것을 2026-09-30에 풀었다. 그동안 사려면
   * 담기 → 장바구니 → 주문하기를 거쳐야 했다 — **뎁스는 리스크다**
   * (CLAUDE.md 8절).
   *
   * ⚠️ **장바구니에 담아둔 것이 있으면 같이 주문된다.** 「이것만」을
   * 따로 만들려면 장바구니와 별개의 길을 하나 더 내야 하는데, 주문서에
   * 상품 목록이 그대로 보이므로 속는 일은 없다고 봤다.
   */
  function buyNow() {
    put()
    router.push('/checkout')
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
          <Label className="mb-3">Option</Label>
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
        <Label>Total</Label>
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
          Add to Cart
        </button>
        <button
          type="button"
          onClick={buyNow}
          disabled={soldOut}
          className="bg-ink text-cloud text-caption w-full py-3.5 tracking-widest uppercase disabled:cursor-not-allowed disabled:opacity-40"
        >
          {soldOut ? 'Sold Out' : 'Buy It Now'}
        </button>
      </div>
    </div>
  )
}
