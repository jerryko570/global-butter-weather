'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Label from '@/components/Label'
import { imageUrl } from '@/lib/images'
import { formatKRW } from '@/lib/queries/products'
import { cartTotalKrw, useCart, useCartLines } from '@/lib/store/cart'
import { amountUntilFreeShipping, shippingFee } from '@/lib/shipping'
import { alreadyOrderedVariantIds } from './actions'

/**
 * 장바구니. 주소는 `/cart` 다.
 *
 * **서랍(drawer)이 아니라 화면이다.** 옛 레포는 `openCart` 같은 상태만
 * 만들어두고 화면을 끝내지 않았다 — 계승할 것이 없어 새로 정했다.
 * 서랍은 화면 위에 큰 면을 덮는데, 계승한 디자인은 **얇은 선으로 나뉜
 * 인쇄물**이라 그 위에 떠 있는 면이 어울리지 않는다 (foundation.md 5-6절
 * 「UI 는 면을 갖지 않고 틈에 산다」).
 *
 * **담긴 것은 브라우저에만 있다.** 그래서 이 화면은 client 다.
 *
 * ---
 *
 * ## 이미 산 것이 남아 있을 수 있다 ★ (2026-09-27)
 *
 * 결제가 끝나는 길이 셋인데 그중 **결제하고 탭을 닫는 경우**는 브라우저가
 * 없을 때 끝난다(웹훅). 그때는 비울 방법이 없어서, 다시 왔을 때 **물어본다.**
 *
 * **조용히 지우지 않는다.** 같은 물건을 또 살 수 있고 — 선물이면 더 그렇다 —
 * 말없이 사라지면 담은 것이 없어진 것처럼 보인다. `actions.ts` 참고.
 *
 * ⚠️ **여기 보이는 가격은 담을 때의 값이다.** 그 뒤에 값이 바뀌었을 수
 * 있다. 영수증의 숫자는 주문할 때 서버가 DB 에서 다시 읽는다
 * (schema.md 7-3절). 이 화면이 계산한 합계를 주문에 쓰지 말 것.
 */
export default function CartPage() {
  const lines = useCartLines()
  const setQuantity = useCart((s) => s.setQuantity)
  const remove = useCart((s) => s.remove)
  const [ordered, setOrdered] = useState<string[]>([])

  // 담긴 것이 바뀔 때마다 다시 묻는다. 로그인하지 않았으면 빈 배열이 온다.
  // **effect 안에서 곧바로 setState 하지 않는다** — 답이 온 뒤에만 고친다
  useEffect(() => {
    const ids = lines.map((l) => l.variantId)
    if (ids.length === 0) return
    let alive = true
    alreadyOrderedVariantIds(ids)
      .then((found) => {
        if (alive) setOrdered(found)
      })
      .catch(() => {
        // 못 물어봤다고 장바구니를 못 쓰게 할 이유는 없다
      })
    return () => {
      alive = false
    }
  }, [lines])

  // **담긴 것에서 지워진 id 는 빼고 센다.** 답을 받아둔 뒤에 손님이
  // 직접 지웠을 수 있다 — 그때 안내가 남아 있으면 틀린 말이 된다
  const orderedInCart = ordered.filter((id) =>
    lines.some((l) => l.variantId === id)
  )

  const itemsKrw = cartTotalKrw(lines)
  const shippingKrw = shippingFee(itemsKrw)
  const total = itemsKrw + shippingKrw
  const untilFree = amountUntilFreeShipping(itemsKrw)

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 px-7 py-5">
        <h1 className="text-ink text-title font-serif">장바구니</h1>
        <Label>{lines.length}개 품목</Label>
      </div>

      {orderedInCart.length > 0 ? (
        <div className="flex flex-col items-start gap-3 border-b border-gray-200 bg-gray-50 px-7 py-5">
          <p className="text-ink text-caption">
            최근에 주문하신 상품이 {orderedInCart.length}개 담겨 있습니다.
          </p>
          <button
            type="button"
            onClick={() => {
              orderedInCart.forEach((id) => remove(id))
            }}
            className="text-caption border-ink text-ink border px-4 py-2"
          >
            주문한 것 빼기
          </button>
        </div>
      ) : null}

      {lines.length === 0 ? (
        <div className="border-b border-gray-200 px-7 py-24 text-center">
          <p className="text-ink-muted text-body mb-8">담긴 것이 없습니다.</p>
          <Link
            href="/"
            className="bg-ink text-cloud text-caption px-7 py-3 tracking-widest uppercase"
          >
            상품 보러 가기
          </Link>
        </div>
      ) : (
        <>
          <div className="border-b border-gray-200">
            {lines.map((l) => (
              <div
                key={l.variantId}
                className="flex items-center gap-4 border-b border-gray-200 px-7 py-5 last:border-b-0"
              >
                <Link
                  href={`/products/${l.slug}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden bg-gray-100"
                >
                  {l.image ? (
                    <Image
                      src={imageUrl(l.image)}
                      alt={l.productName}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : null}
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${l.slug}`}
                    className="text-ink text-body hover:underline"
                  >
                    {l.productName}
                  </Link>
                  <p className="text-ink-muted text-caption mt-1">
                    {l.variantName}
                  </p>
                  <p className="text-ink text-caption mt-1">
                    {formatKRW(l.priceKrw)}
                  </p>
                </div>

                {/* 수량 — 상세와 같은 − 1 + 이다 */}
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(l.variantId, l.quantity - 1)}
                    aria-label="수량 줄이기"
                    className="text-ink-muted hover:border-ink flex h-8 w-8 items-center justify-center border border-gray-200 transition-colors"
                  >
                    −
                  </button>
                  <span className="text-ink text-caption w-6 text-center">
                    {l.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(l.variantId, l.quantity + 1)}
                    disabled={l.quantity >= l.stock}
                    aria-label="수량 늘리기"
                    className="text-ink-muted hover:border-ink flex h-8 w-8 items-center justify-center border border-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                <p className="text-ink text-body w-24 shrink-0 text-right font-medium">
                  {formatKRW(l.priceKrw * l.quantity)}
                </p>

                <button
                  type="button"
                  onClick={() => remove(l.variantId)}
                  className="text-ink-subtle text-caption shrink-0 hover:text-red-600"
                >
                  빼기
                </button>
              </div>
            ))}
          </div>

          {/* ───── 합계 ───── */}
          <div className="grid grid-cols-1 border-b border-gray-200 lg:grid-cols-2">
            <div className="hidden lg:block lg:border-r lg:border-gray-200" />
            <div className="flex flex-col gap-4 p-8 lg:p-12">
              <div className="flex items-baseline justify-between pb-1">
                <Label>상품</Label>
                <p className="text-ink-muted text-caption">
                  {formatKRW(itemsKrw)}
                </p>
              </div>
              <div className="flex items-baseline justify-between pb-3">
                <Label>배송비</Label>
                <p className="text-ink-muted text-caption">
                  {shippingKrw === 0 ? '무료' : formatKRW(shippingKrw)}
                </p>
              </div>
              <div className="flex items-baseline justify-between border-t border-b border-gray-200 py-4">
                <Label>Total</Label>
                <p className="text-ink text-title font-medium">
                  {formatKRW(total)}
                </p>
              </div>
              {untilFree > 0 ? (
                <p className="text-ink-subtle text-caption">
                  {formatKRW(untilFree)} 더 담으면 배송비가 무료입니다.
                </p>
              ) : null}

              <Link
                href="/checkout"
                className="bg-ink text-cloud text-caption w-full py-3.5 text-center tracking-widest uppercase"
              >
                주문하기
              </Link>
              <p className="text-ink-subtle text-caption">
                주문서에서 배송지를 입력받습니다.{' '}
                <strong>결제는 아직 준비 중입니다.</strong>
              </p>
            </div>
          </div>
        </>
      )}
    </>
  )
}
