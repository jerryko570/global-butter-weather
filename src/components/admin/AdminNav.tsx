'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

/**
 * 어드민 상단 줄. **가게 화면의 사이드바를 쓰지 않는다** — 손님이 보는
 * 껍데기와 섞이면 지금 어디에 있는지 헷갈린다.
 *
 * 로그인한 이메일을 늘 띄워 둔다. **관리자가 아닌 계정으로 로그인해도
 * 화면은 열리기 때문이다** — 쓰기만 RLS 가 조용히 막는다. 누구로 들어와
 * 있는지 보이지 않으면 「저장이 안 되는데 이유를 모르는」 상태가 된다.
 */
export default function AdminNav() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push('/admin/login')
  }

  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-6">
        <Link href="/admin/products" className="text-ink text-body font-serif">
          버터웨더 관리
        </Link>
        <Link href="/" className="text-ink-subtle hover:text-ink text-caption">
          가게 화면 보기
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-ink-muted text-caption">
          {email ?? '로그인하지 않음'}
        </span>
        {email ? (
          <button
            type="button"
            onClick={signOut}
            className="text-ink-subtle hover:text-ink text-caption"
          >
            로그아웃
          </button>
        ) : (
          <Link
            href="/admin/login"
            className="text-ink-subtle hover:text-ink text-caption"
          >
            로그인
          </Link>
        )}
      </div>
    </div>
  )
}
