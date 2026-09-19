'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * **어드민 전용 client.** 로그인 세션을 들고 다닌다.
 *
 * 손님 화면이 쓰는 `@/lib/supabase/client` 와 일부러 나눠 두었다. 그쪽은
 * 공개 데이터만 읽는 하나짜리 client 라 세션이 없고, 서버 component 에서도
 * 같은 것을 쓴다. **세션이 붙은 client 를 서버와 공유하면 요청 사이에
 * 로그인 상태가 새어 나갈 수 있다.**
 *
 * 세션은 쿠키에 담긴다(`@supabase/ssr`). localStorage 가 아니라 쿠키인
 * 이유는 나중에 서버에서도 로그인 여부를 볼 수 있어야 하기 때문이다 —
 * 지금은 화면에서만 보지만, 그때 이 파일을 안 고쳐도 된다.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
