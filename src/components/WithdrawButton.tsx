'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { withdraw } from '@/app/(shop)/account/actions'
import { createClient } from '@/lib/supabase/browser'
import { useCart } from '@/lib/store/cart'

/**
 * 회원 탈퇴. **되돌릴 수 없어서 한 번에 눌리지 않게 한다.**
 *
 * 주문 취소는 사유를 적게 했는데(`CancelOrderButton`) 여기는 **무엇이
 * 사라지는지를 먼저 보여준다.** 사유를 받아도 쓸 데가 없고, 손님이
 * 알아야 하는 것은 「왜 나가는가」가 아니라 「무엇이 없어지는가」다.
 */
export default function WithdrawButton() {
  const router = useRouter()
  const clearCart = useCart((s) => s.clear)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setError(null)
    setBusy(true)
    try {
      const r = await withdraw()
      if (!r.ok) {
        setError(r.reason)
        return
      }
      // 계정이 없어졌다. 브라우저에 남은 것도 함께 치운다
      clearCart()
      await createClient().auth.signOut()
      router.replace('/')
      router.refresh()
    } catch {
      setError('탈퇴하지 못했습니다. 잠시 뒤 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-ink-subtle hover:text-ink text-caption self-start underline"
      >
        회원 탈퇴
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3 border border-red-200 bg-red-50 p-5">
      <p className="text-caption text-red-600">
        <strong>되돌릴 수 없습니다.</strong>
      </p>

      <ul className="text-caption flex list-disc flex-col gap-1 pl-4 text-red-600">
        <li>
          로그인 계정이 없어집니다. 같은 계정으로 다시 들어오셔도 새 회원입니다.
        </li>
        <li>지난 주문의 받는 분·연락처·주소가 지워집니다.</li>
        <li>
          주문 기록 자체는 남습니다 — 법이 거래 기록을 5년 동안 보관하라고
          정하고 있습니다.
        </li>
      </ul>

      {error ? (
        <p className="text-caption whitespace-pre-line text-red-600">{error}</p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="text-caption border border-red-400 bg-red-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? '처리하는 중…' : '정말 탈퇴합니다'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setError(null)
          }}
          disabled={busy}
          className="text-caption text-ink-muted hover:text-ink px-4 py-2"
        >
          그만두기
        </button>
      </div>
    </div>
  )
}
