'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { useCart } from '@/lib/store/cart'

/**
 * 상단 줄의 로그인 자리. **로그인 전에는 「로그인」, 뒤에는 이름과
 * 「로그아웃」**이다.
 *
 * ⚠️ **구독한다.** 한 번만 읽으면 안 된다 — 이 component 는
 * `(shop)/layout.tsx` 에 있어 화면을 옮겨도 다시 mount 되지 않는다.
 * AdminNav 에서 같은 실수를 한 적이 있다 (2026-09-19).
 *
 * **회원가입 링크를 두지 않는다.** 가입이라는 단계가 없다 — 처음 온
 * 사람도 「로그인」으로 들어가 구글·카카오를 누르면 끝난다.
 */
export default function AuthLinks() {
  const router = useRouter()
  const pathname = usePathname()
  const [name, setName] = useState<string | null>(null)
  const clearCart = useCart((s) => s.clear)

  useEffect(() => {
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // **로그아웃하면 장바구니를 비운다.** 장바구니는 브라우저에 있어서
      // 로그인과 무관하게 남는다 — 그대로 두면 **다음 사람이 앞사람이
      // 담은 것을 물려받는다** (2026-09-22에 실제로 그랬다).
      //
      // INITIAL_SESSION 에서는 비우지 않는다. 그건 「방금 로그아웃했다」가
      // 아니라 「원래 로그인 안 한 상태」다 — 비로그인으로 담아둔 것을
      // 새로고침할 때마다 지우게 된다.
      if (event === 'SIGNED_OUT') clearCart()

      const user = session?.user
      if (!user) {
        setName(null)
        return
      }
      // 카카오는 이메일을 안 줄 수 있다(비즈니스 앱만 준다). 그래서
      // 이름 → 닉네임 → 이메일 순으로 있는 것을 쓴다
      const meta = user.user_metadata ?? {}
      setName(
        (meta.name as string) ??
          (meta.full_name as string) ??
          (meta.preferred_username as string) ??
          user.email ??
          '로그인됨'
      )
    })

    return () => subscription.unsubscribe()
  }, [clearCart])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  if (name) {
    return (
      <>
        <Link
          href="/orders"
          className="text-ink-muted hover:text-ink text-caption"
        >
          주문 내역
        </Link>
        <span className="text-ink text-caption max-w-32 truncate">{name}</span>
        <button
          type="button"
          onClick={signOut}
          className="text-ink-muted hover:text-ink text-caption"
        >
          로그아웃
        </button>
      </>
    )
  }

  return (
    <Link
      href={`/login?next=${encodeURIComponent(pathname)}`}
      className="text-ink-muted hover:text-ink text-caption"
    >
      로그인
    </Link>
  )
}
