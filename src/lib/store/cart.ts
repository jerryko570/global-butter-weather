'use client'

import { useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 장바구니. **브라우저에 담는다** — 서버에 두지 않는다.
 *
 * 옛 레포도 같은 방식이었다(`lib/store/cartStore.ts`). 로그인하지 않은
 * 사람도 담을 수 있어야 하고, 담는 것 자체는 아직 약속이 아니다.
 *
 * ---
 *
 * **한 줄은 「상품」이 아니라 「옵션」이다 ★**
 *
 * 옛 쪽은 줄의 열쇠가 상품 id 였다. 가격과 재고가 상품에 붙어 있었기
 * 때문이다. 우리는 옵션마다 값이 다르므로(schema.md 1절) **그린가든과
 * 브릭가든은 서로 다른 줄**이다. 열쇠는 `variant_id` 다.
 *
 * ---
 *
 * ⚠️ **여기 담긴 가격은 보여주기 위한 것이다.** 주문을 만들 때 이 값을
 * 쓰지 않는다 — 장바구니는 브라우저에 몇 주씩 남아 있어서 그동안 값이
 * 바뀔 수 있고, 손님이 고칠 수도 있다. **영수증의 숫자는 주문 시점에
 * 서버가 DB 에서 다시 읽어 박제한다** (schema.md 7-3절).
 */

export type CartLine = {
  /** 줄의 열쇠. 상품이 아니라 옵션이다 */
  variantId: string
  productId: string
  slug: string
  /** 아래 셋은 **보여주기 위한 사본**이다. 주문에 쓰지 않는다 */
  productName: string
  variantName: string
  priceKrw: number
  /** 저장소 안의 경로. 주소를 만드는 것은 `imageUrl()` 이 한다 */
  image: string | null
  quantity: number
  /** 담을 때의 재고. 수량 상한으로만 쓴다 — 진짜 확인은 결제 때다 */
  stock: number
}

type CartState = {
  lines: CartLine[]
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void
  setQuantity: (variantId: string, quantity: number) => void
  remove: (variantId: string) => void
  clear: () => void
}

/** 담을 때 재고를 넘지 못하게 한다. 진짜 확인은 결제 때다 */
function clamp(n: number, stock: number) {
  return Math.max(1, Math.min(n, Math.max(stock, 1)))
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],

      add: (line, quantity = 1) =>
        set((s) => {
          const found = s.lines.find((l) => l.variantId === line.variantId)
          if (found) {
            // 이미 담긴 옵션이면 수량만 올린다. 줄을 두 개로 나누지 않는다
            return {
              lines: s.lines.map((l) =>
                l.variantId === line.variantId
                  ? { ...l, quantity: clamp(l.quantity + quantity, line.stock) }
                  : l
              ),
            }
          }
          return {
            lines: [
              ...s.lines,
              { ...line, quantity: clamp(quantity, line.stock) },
            ],
          }
        }),

      setQuantity: (variantId, quantity) =>
        set((s) => ({
          // 0 으로 내리면 뺀다. 「0개 담김」이라는 상태를 두지 않는다
          lines:
            quantity <= 0
              ? s.lines.filter((l) => l.variantId !== variantId)
              : s.lines.map((l) =>
                  l.variantId === variantId
                    ? { ...l, quantity: clamp(quantity, l.stock) }
                    : l
                ),
        })),

      remove: (variantId) =>
        set((s) => ({
          lines: s.lines.filter((l) => l.variantId !== variantId),
        })),

      clear: () => set({ lines: [] }),
    }),
    {
      name: 'butter-weather-cart',
      version: 1,
    }
  )
)

/** 합계. store 밖에 두는 것은 **저장되는 값과 계산되는 값을 섞지 않으려는** 것이다 */
export function cartTotalKrw(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.priceKrw * l.quantity, 0)
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0)
}

/**
 * 화면이 읽는 창구. **서버에서는 늘 빈 것으로 본다.**
 *
 * 장바구니는 브라우저에만 있으므로 서버가 그릴 때는 알 수 없다. 그 차이를
 * 그대로 두면 hydration 에서 어긋난다 — `getServerSnapshot` 이 그 자리를
 * 메운다. React 가 붙은 뒤에 실제 값으로 한 번 다시 그린다.
 *
 * ThemeToggle 과 같은 방식이다(`useSyncExternalStore`). effect 안에서
 * state 를 건드리지 않으므로 렌더가 연쇄되지 않는다.
 */

/** 참조가 매번 바뀌면 무한 렌더가 된다. 빈 배열을 하나만 둔다 */
const EMPTY: CartLine[] = []

export function useCartLines(): CartLine[] {
  return useSyncExternalStore(
    useCart.subscribe,
    () => useCart.getState().lines,
    () => EMPTY
  )
}

export function useCartCount(): number {
  return useSyncExternalStore(
    useCart.subscribe,
    () => cartCount(useCart.getState().lines),
    () => 0
  )
}
