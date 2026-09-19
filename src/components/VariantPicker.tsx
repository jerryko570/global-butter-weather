'use client'

import { useState } from 'react'
import Label from '@/components/Label'
import { formatKRW } from '@/lib/queries/products'
import type { ProductVariant } from '@/types/product'

/**
 * 옵션을 고르고 가격을 보는 자리.
 *
 * **가격은 고른 옵션의 것을 보여준다.** 목록은 「얼마부터」였지만 여기서는
 * 고른 것 하나의 값이다 (schema.md 1절 — 가격은 옵션에 붙어 있다).
 *
 * 처음 고르는 것은 **재고가 있는 첫 옵션**이다. 품절인 것이 먼저 잡혀
 * 살 수 없는 화면으로 열리지 않게 한다.
 *
 * ⚠️ **장바구니는 아직 없다 (M3).** 버튼은 자리만 잡아두고 눌리지 않는다 —
 * 눌러도 아무 일이 없는 버튼보다 왜 안 되는지 보이는 편이 낫다는 판단이다
 * (2026-09-19 이나래 확인). M3에서 이 자리에 기능만 넣으면 된다.
 */
export default function VariantPicker({
  variants,
}: {
  variants: ProductVariant[]
}) {
  const firstInStock = variants.findIndex((v) => v.stock > 0)
  const [selected, setSelected] = useState(
    firstInStock === -1 ? 0 : firstInStock
  )

  const variant = variants[selected]
  const allSoldOut = variants.every((v) => v.stock === 0)

  return (
    <div>
      <p className="text-ink text-title mb-8 font-serif">
        {formatKRW(variant.price_krw)}
      </p>

      {/* 옵션이 하나뿐이면 고를 것이 없다. 그래도 재고는 알려준다 */}
      {variants.length > 1 ? (
        <div className="mb-8">
          <Label className="mb-3">Option</Label>
          <div className="flex flex-wrap gap-2">
            {variants.map((v, i) => {
              const soldOut = v.stock === 0
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={soldOut}
                  onClick={() => setSelected(i)}
                  aria-pressed={i === selected}
                  className={`text-caption border px-5 py-2.5 ${
                    soldOut
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

      <div className="mb-8 flex items-center gap-2">
        <Label>Stock</Label>
        <span className="text-ink-muted text-caption">
          {variant.stock === 0 ? '품절' : `${variant.stock}개 남음`}
        </span>
      </div>

      {/*
        M3 전까지 눌리지 않는다. disabled 만 두고 안내를 생략하면 고장난
        화면으로 읽히므로 아래 문장을 같이 둔다.
      */}
      <button
        type="button"
        disabled
        className="bg-ink text-cloud text-caption w-full cursor-not-allowed px-7 py-4 tracking-widest uppercase opacity-40"
      >
        {allSoldOut ? 'Sold Out' : 'Add to Cart'}
      </button>
      <p className="text-ink-subtle text-caption mt-3">
        장바구니는 아직 준비 중입니다. 구매 문의는 인스타그램
        <span className="text-ink-muted"> @butterweather_ </span>
        으로 부탁드립니다.
      </p>
    </div>
  )
}
