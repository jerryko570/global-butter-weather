'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

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

  useEffect(() => {
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  if (name) {
    return (
      <>
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
