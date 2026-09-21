import { NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'

/**
 * OAuth 가 돌아오는 자리. **Supabase 의 Callback URL 이 아니다.**
 *
 * 길은 이렇게 셋으로 이어진다.
 *
 * ```
 * 손님 → 구글·카카오 로그인
 *      → https://<ref>.supabase.co/auth/v1/callback   (콘솔에 등록한 것)
 *      → 여기 /auth/callback                           (Supabase 가 보내는 곳)
 *      → 원래 있던 화면
 * ```
 *
 * 여기서 하는 일은 **`code` 를 세션 쿠키로 바꾸는 것** 하나다. 이 교환을
 * 하지 않으면 로그인한 것처럼 돌아왔는데 세션이 없는 상태가 된다.
 *
 * ⚠️ 서버 component 가 아니라 **route handler 여야 한다.** 쿠키를 심어야
 * 하는데 서버 component 는 쓸 수 없다 (`lib/supabase/server.ts` 참조).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // 로그인 전에 있던 화면으로 돌려보낸다. 장바구니에서 눌렀으면 장바구니로.
  // **밖에서 온 값이라 그대로 믿지 않는다** — `/` 로 시작하는 우리 안의
  // 주소만 받는다. 아니면 다른 사이트로 튕겨 보낼 수 있다.
  const raw = searchParams.get('next') ?? '/'
  const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = await createRouteClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    // 무엇이 틀렸는지 주소에 적지 않는다. 손님이 고칠 수 있는 것이 아니고,
    // 자세한 사정은 밖에 알릴 이유가 없다
    return NextResponse.redirect(`${origin}/login?error=exchange`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
