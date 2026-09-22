import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * **RLS 를 지나는 client.** `secret` 키를 쓴다.
 *
 * ⚠️ **거의 모든 곳에서 쓰면 안 된다.** RLS 가 「누구의 것인가」를 지키는
 * 유일한 벽인데 이 client 는 그 벽을 넘는다. 손님 요청을 대신 처리하는
 * 자리에 쓰면 남의 주문도 읽고 고칠 수 있게 된다.
 *
 * **지금 쓰는 곳은 하나다 — `mark_order_paid()`.**
 * 그 함수는 실행 권한이 `service_role` 에게만 있다 (`0005_orders.sql`).
 * **결제가 실제로 됐는지는 서버만 알기 때문이다** — 손님이 직접 부를 수
 * 있으면 결제 없이 재고를 깎고 주문을 완료시킬 수 있다.
 *
 * `server-only` 를 import 하는 것은 **실수로 브라우저 번들에 들어가면
 * 빌드가 죽게** 하려는 것이다. 이 키가 브라우저로 나가면 DB 가 통째로
 * 열린다.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY
  if (!key) {
    throw new Error(
      'SUPABASE_SECRET_KEY 가 없습니다. Vercel 환경변수에 넣으세요 — ' +
        '저장소에 두지 않습니다 (CLAUDE.md 3-2절).'
    )
  }

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    // 이 client 는 사람을 대신하지 않는다. 세션을 들고 다닐 이유가 없다
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
