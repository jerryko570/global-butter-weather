'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Label from '@/components/Label'
import { createClient } from '@/lib/supabase/browser'

/**
 * 어드민 로그인. Supabase Auth 이메일+비밀번호다 (옛 레포와 같다).
 *
 * 로그인에 성공하면 세션 쿠키가 심어지고, `0003` 의 정책이 그 이메일을
 * 보고 쓰기를 열어준다.
 *
 * ⚠️ **로그인에 성공했다고 관리자인 것은 아니다.** `admin_emails` 에 없는
 * 계정도 로그인 자체는 된다 — 다만 쓰기가 전부 막힌다. 그래서 여기서
 * 「관리자입니다」라고 말하지 않는다. 확인은 실제로 저장해 봐야 난다.
 *
 * 계정은 대시보드에서 만든다 (Authentication → Users). **여기에 가입
 * 화면을 두지 않는다** — 누구나 계정을 만들 수 있게 할 이유가 없다.
 */
export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)

    if (error) {
      // 어느 쪽이 틀렸는지 알려주지 않는다. 알려주면 어떤 이메일이
      // 등록돼 있는지 밖에서 알아낼 수 있다.
      setError('로그인하지 못했습니다. 이메일과 비밀번호를 확인해 주세요.')
      return
    }

    router.refresh()
    router.push('/admin/products')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-sm flex-col gap-6 border border-gray-200 p-8"
    >
      <div>
        <Label className="mb-2">Admin</Label>
        <h1 className="text-ink text-title font-serif">관리자 로그인</h1>
      </div>

      <label className="flex flex-col gap-2">
        <Label>이메일</Label>
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="text-ink text-body focus:border-ink border border-gray-300 px-3 py-2 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2">
        <Label>비밀번호</Label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="text-ink text-body focus:border-ink border border-gray-300 px-3 py-2 focus:outline-none"
        />
      </label>

      {error ? (
        <p className="text-caption border border-red-200 bg-red-50 p-3 text-red-600">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="bg-ink text-cloud text-caption py-3 tracking-widest uppercase disabled:opacity-40"
      >
        {loading ? '확인 중…' : 'Sign In'}
      </button>
    </form>
  )
}
