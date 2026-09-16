import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client. **지금은 공개 읽기 전용이다.**
 *
 * 로그인이 아직 없으므로 쿠키를 다룰 일이 없고, 그래서 `@supabase/ssr`의
 * `createBrowserClient`·`createServerClient` 대신 기본 client 를 쓴다.
 * 서버 component 에서도 같은 것을 쓴다 — 읽는 것이 전부 공개 데이터라
 * 요청마다 client 를 새로 만들 이유가 없다.
 *
 * **로그인이 붙으면 이 파일을 갈아야 한다.** 그때는 요청마다 쿠키를 읽어야
 * 하므로 client 를 하나로 공유할 수 없다.
 *
 * ---
 *
 * 키는 **publishable**(`sb_publishable_*`)이다. `anon` 키는 2026년 말에
 * 제거된다 (docs/dev/schema.md 6절). 둘 다 브라우저로 나가는 값이라
 * 비밀이 아니고, 데이터를 지키는 것은 키가 아니라 **RLS**다.
 *
 * `secret` 키를 여기에 쓰지 말 것. 그것은 RLS 를 우회한다.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  // 빌드가 조용히 통과하고 화면에서 빈 목록으로 나타나는 것을 막는다.
  // 필요한 값은 .env.example 에 적혀 있다.
  throw new Error(
    'Supabase 환경변수가 없습니다. .env.example 을 보고 .env.local 을 만드세요 — ' +
      'NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
  )
}

export const supabase = createClient(url, key)
