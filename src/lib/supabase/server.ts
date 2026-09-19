import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * **서버에서 로그인 상태를 읽는 client.** 어드민 화면이 쓴다.
 *
 * 손님 화면이 쓰는 `@/lib/supabase/client` 와 다르다. 그쪽은 모듈 하나를
 * 공유하는 client 라 세션이 없다 — 공개 데이터만 읽기 때문이다.
 *
 * **여기서는 요청마다 새로 만든다.** 쿠키가 요청마다 다르므로 하나를
 * 공유하면 남의 로그인 상태로 조회하게 된다.
 *
 * 세션은 브라우저 쪽 `createBrowserClient` 가 쿠키에 심어 둔 것을 읽는다.
 * 그래서 **서버 component 도 감춘 상품을 볼 수 있다** — 관리자로 로그인해
 * 있을 때 이야기고, 판단은 여전히 RLS 가 한다 (`0003`).
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        // 서버 component 에서는 쿠키를 쓸 수 없다. 세션 갱신은 브라우저
        // 쪽이 맡으므로 여기서는 조용히 넘긴다 — 던지면 화면이 죽는다.
        setAll() {},
      },
    }
  )
}

/**
 * **route handler 전용 client.** 쿠키를 실제로 심는다.
 *
 * 위의 `createClient()` 는 `setAll` 이 빈 함수다 — 서버 component 에서는
 * 쿠키를 쓸 수 없기 때문이다. 그런데 **OAuth 콜백은 세션 쿠키를 심어야
 * 한다.** route handler 는 쓸 수 있으므로 여기서만 따로 만든다.
 *
 * 둘을 하나로 합치지 말 것. 합치면 서버 component 에서 쿠키를 쓰려다
 * 던지고, 그 예외는 화면 전체를 죽인다.
 */
export async function createRouteClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(list) {
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
