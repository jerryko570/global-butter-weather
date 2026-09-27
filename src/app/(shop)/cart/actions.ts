'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * 담긴 것 중 **이미 주문이 끝난 것**을 알려준다.
 *
 * ---
 *
 * ## 왜 필요한가 ★
 *
 * 장바구니는 브라우저에 있고 주문은 서버에 있다. **둘을 잇는 것은 주문서
 * 화면뿐이었다** — 거기서 결제가 끝나면 비운다.
 *
 * 그런데 결제가 끝나는 길이 셋이다.
 *
 * | 어디서                    | 전에는           |
 * | ------------------------- | ---------------- |
 * | 주문서에서 결제           | 비웠다           |
 * | 주문 내역에서 다시 결제   | **안 비웠다**    |
 * | 결제하고 탭을 닫음 (웹훅) | **알 수가 없다** |
 *
 * 앞의 둘은 화면에서 고칠 수 있지만 **세 번째는 브라우저가 없을 때 끝난다.**
 * 그래서 다시 왔을 때 물어보는 수밖에 없다.
 *
 * ---
 *
 * ## 조용히 지우지 않는다 ★
 *
 * 이 함수는 **알려주기만 한다.** 화면이 「이미 주문하신 것이 있습니다」를
 * 띄우고 손님이 누를 때 지운다.
 *
 * 같은 물건을 또 살 수 있다 — 선물이면 더 그렇다. **말없이 지우면 담은
 * 것이 사라진 것처럼 보인다.** 「살 수 없는 것 빼기」와 같은 방식이다.
 *
 * 최근 것만 본다. 한 달 전에 산 키링을 다시 담았는데 빼라고 하면 틀렸다.
 */

/** 이 안에서 끝난 주문만 센다 */
const RECENT_DAYS = 3

export async function alreadyOrderedVariantIds(
  variantIds: string[]
): Promise<string[]> {
  if (variantIds.length === 0) return []

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const since = new Date(
    Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()

  // RLS 가 남의 주문을 막는다 (`orders_own`). 여기서 user_id 를 다시
  // 비교하지 않는 이유다
  const { data } = await supabase
    .from('orders')
    .select('status, items:order_items(variant_id)')
    .in('status', ['paid', 'shipped', 'done'])
    .gte('created_at', since)

  const ordered = new Set<string>()
  for (const order of data ?? []) {
    for (const item of order.items ?? []) {
      if (item.variant_id) ordered.add(item.variant_id)
    }
  }

  return variantIds.filter((id) => ordered.has(id))
}
