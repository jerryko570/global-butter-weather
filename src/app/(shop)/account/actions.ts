'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * 회원 탈퇴. **개인정보는 지우고 거래 기록은 남긴다.**
 *
 * ---
 *
 * ## 왜 통째로 지우지 않는가
 *
 * 법이 거래 기록을 **5년 보관**하라고 한다(전자상거래법). 그래서 주문을
 * 지울 수 없다. 대신 **누구 것인지 알 수 없게 만든다** — 금액·상품·날짜는
 * 남고 배송지는 비운다 (`anonymize_orders_of`, `0010`).
 *
 * ---
 *
 * ## 배송 중이면 막는다 ★
 *
 * 지우면 **보낼 주소가 없어진다.** 되돌릴 수도 없다. 그래서 끝나지 않은
 * 주문이 하나라도 있으면 거절한다 — 손님에게도 우리에게도 그편이 낫다.
 *
 * 끝난 것은 `done` 과 `cancelled` 뿐이다.
 *
 * ---
 *
 * ## 순서 — 지우고 나서 계정을 없앤다
 *
 * 계정을 먼저 없애면 `user_id` 가 \`null\` 이 되어(\`on delete set null\`)
 * **어느 주문을 지워야 할지 찾을 수 없다.** 되돌릴 방법이 없는 순서다.
 */

export type WithdrawResult =
  | { ok: true; anonymized: number }
  | { ok: false; reason: string }

/** 아직 끝나지 않은 주문. 이게 있으면 탈퇴할 수 없다 */
const IN_FLIGHT = ['pending', 'paid', 'shipped']

export async function withdraw(): Promise<WithdrawResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: '로그인이 필요합니다.' }

  const db = createAdminClient()

  // ── 배송 중인 것이 있으면 막는다 ───────────────────────────
  const { data: live } = await db
    .from('orders')
    .select('order_no, status')
    .eq('user_id', user.id)
    .in('status', IN_FLIGHT)

  if (live && live.length > 0) {
    const nos = live.map((o) => o.order_no).join(', ')
    return {
      ok: false,
      reason: `아직 끝나지 않은 주문이 있습니다 — ${nos}. 배송이 끝난 뒤에 탈퇴하실 수 있습니다.`,
    }
  }

  // ── 배송지를 지운다 ────────────────────────────────────────
  const { data: anonymized, error: anonError } = await db.rpc(
    'anonymize_orders_of',
    { p_user_id: user.id }
  )
  if (anonError) {
    return {
      ok: false,
      reason: '탈퇴하지 못했습니다. 잠시 뒤 다시 시도해 주세요.',
    }
  }

  // ── 계정을 없앤다 ──────────────────────────────────────────
  // **반드시 지운 뒤에 한다.** 먼저 없애면 user_id 가 null 이 되어
  // 어느 주문을 지워야 할지 찾을 수 없다
  const { error: delError } = await db.auth.admin.deleteUser(user.id)
  if (delError) {
    return {
      ok: false,
      reason: '배송지는 지웠지만 계정을 없애지 못했습니다. 다시 시도해 주세요.',
    }
  }

  return { ok: true, anonymized: (anonymized as number) ?? 0 }
}
