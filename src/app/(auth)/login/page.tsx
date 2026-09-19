'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Label from '@/components/Label'
import { createClient } from '@/lib/supabase/browser'

/**
 * 손님 로그인. **구글·카카오뿐이다.**
 *
 * 옛 레포는 이메일+비밀번호였고 회원가입 화면이 따로 있었다. 우리는
 * **가입이라는 단계를 두지 않는다** — 누르면 1~2초에 끝난다
 * (schema.md 7-3절, 2026-09-19 이나래 확정).
 *
 * 그래서 **비밀번호 칸이 없고 회원가입 화면도 없다.** 처음 누른 사람과
 * 다시 온 사람이 같은 버튼을 쓴다.
 *
 * 어드민 로그인(`/admin/login`)과 다른 화면이다. 그쪽은 이메일+비밀번호이고
 * 관리자만 쓴다.
 */

/** 로그인 뒤 돌아갈 곳. 장바구니에서 눌렀으면 장바구니로 */
function useNext() {
  const params = useSearchParams()
  const raw = params.get('next') ?? '/'
  // 밖에서 온 값이라 그대로 믿지 않는다 — 우리 안의 주소만 받는다
  return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/'
}

const PROVIDERS = [
  { id: 'google', label: 'Google로 계속하기' },
  { id: 'kakao', label: '카카오로 계속하기' },
] as const

/**
 * ⚠️ **`useSearchParams` 를 Suspense 로 감싸야 한다.** 이 값은 서버가
 * 미리 구울 때 알 수 없어서, 감싸지 않으면 빌드가 「/login 을 미리 구울
 * 수 없다」며 멈춘다 (2026-09-20에 실제로 그랬다).
 *
 * 바깥 틀은 미리 굽고 **안쪽만 브라우저에서 채운다.**
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginForm />
    </Suspense>
  )
}

/** 기다리는 동안 보이는 것. 틀이 같아야 내용이 채워질 때 안 흔들린다 */
function LoginShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-10 text-center">
        <Link
          href="/"
          className="text-ink text-wordmark font-serif tracking-widest uppercase"
        >
          Butter Weather
        </Link>
      </div>
      <div className="border border-gray-200 p-8">
        <Label className="mb-2">Sign In</Label>
        <h1 className="text-ink text-title mb-2 font-serif">로그인</h1>
        {children}
      </div>
    </div>
  )
}

function LoginForm() {
  const next = useNext()
  const params = useSearchParams()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(
    params.get('error') ? '로그인하지 못했습니다. 다시 시도해 주세요.' : null
  )

  async function signIn(provider: 'google' | 'kakao') {
    setError(null)
    setBusy(provider)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // 돌아올 곳은 **우리 route handler** 다. 거기서 code 를 세션으로
        // 바꾼다 (`app/auth/callback/route.ts`)
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    if (error) {
      setError('로그인하지 못했습니다. 다시 시도해 주세요.')
      setBusy(null)
    }
    // 성공하면 브라우저가 구글·카카오로 떠나므로 여기 코드는 더 돌지 않는다
  }

  return (
    <LoginShell>
      <>
        <p className="text-ink-muted text-caption mb-8 leading-relaxed">
          따로 가입하실 것이 없습니다. 아래에서 하나 고르시면 바로 시작됩니다.
        </p>

        <div className="flex flex-col gap-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => signIn(p.id)}
              disabled={busy !== null}
              className="text-ink hover:border-ink text-caption w-full border border-gray-300 py-3.5 tracking-widest uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy === p.id ? '이동 중…' : p.label}
            </button>
          ))}
        </div>

        {error ? (
          <p className="text-caption mt-6 border border-red-200 bg-red-50 p-3 text-red-600">
            {error}
          </p>
        ) : null}

        <p className="text-ink-subtle text-caption mt-8 leading-relaxed">
          로그인하면 주문 내역을 확인하실 수 있습니다. 배송지는 주문하실 때
          입력받습니다.
        </p>
      </>
    </LoginShell>
  )
}
