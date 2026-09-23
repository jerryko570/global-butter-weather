'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { cancelOrder } from '@/app/admin/orders/actions'

/**
 * 주문 취소. **돈이 손님에게 돌아가는 버튼이라 한 번에 눌리지 않게 한다.**
 *
 * 확인 창(`confirm`)을 쓰지 않고 **사유를 적게 한다.** 두 가지를 같이 얻는다
 * — 실수로 눌리지 않고, `cancel_reason` 에 「왜」가 남는다. 나중에 아무도
 * 설명하지 못하는 취소가 쌓이지 않는다.
 */
export default function CancelOrderButton({
  orderNo,
  canCancel,
}: {
  orderNo: string
  canCancel: boolean
}) {
  const router = useRouter()
  const { show } = useToast()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canCancel) return null

  async function run() {
    setError(null)
    setBusy(true)
    try {
      const r = await cancelOrder(orderNo, reason)
      if (!r.ok) {
        setError(r.reason)
        return
      }
      show('주문을 취소했습니다')
      setOpen(false)
      router.refresh()
    } catch {
      setError('취소하지 못했습니다. 잠시 뒤 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-caption border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50"
      >
        주문 취소
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3 border border-red-200 bg-red-50 p-4">
      <p className="text-caption text-red-600">
        결제를 취소하고 재고를 되돌립니다. <strong>되돌릴 수 없습니다.</strong>
      </p>

      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="취소 사유 (손님에게 보이지 않습니다)"
        maxLength={100}
        className="text-body border border-gray-300 bg-white px-3 py-2"
      />

      {error ? (
        <p className="text-caption whitespace-pre-line text-red-600">{error}</p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={run}
          disabled={busy || !reason.trim()}
          className="text-caption border border-red-400 bg-red-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? '취소하는 중…' : '정말 취소합니다'}
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
