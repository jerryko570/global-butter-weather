'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { markDone, markShipped } from '@/app/admin/orders/actions'
import { CARRIERS } from '@/lib/carriers'

/**
 * 배송 처리. **주문 상태에 따라 다른 것이 보인다.**
 *
 * | 상태      | 보이는 것                    |
 * | --------- | ---------------------------- |
 * | `paid`    | 택배사 + 송장번호 → 「보냈습니다」 |
 * | `shipped` | 「배송 완료로 바꾸기」        |
 * | 그 밖     | 아무것도 없다                 |
 *
 * 취소와 달리 **확인 절차를 두지 않는다.** 돈이 움직이지 않고, 잘못 넣어도
 * 번호를 고쳐 다시 넣으면 된다.
 */
export default function ShipOrderForm({
  orderNo,
  status,
}: {
  orderNo: string
  status: string
}) {
  const router = useRouter()
  const { show } = useToast()
  const [carrier, setCarrier] = useState(CARRIERS[0].code)
  const [trackingNo, setTrackingNo] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function ship() {
    setError(null)
    setBusy(true)
    try {
      const r = await markShipped(orderNo, carrier, trackingNo)
      if (!r.ok) {
        setError(r.reason)
        return
      }
      show('배송 중으로 바꿨습니다')
      setTrackingNo('')
      router.refresh()
    } catch {
      setError('바꾸지 못했습니다. 잠시 뒤 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  async function done() {
    setError(null)
    setBusy(true)
    try {
      const r = await markDone(orderNo)
      if (!r.ok) {
        setError(r.reason)
        return
      }
      show('배송 완료로 바꿨습니다')
      router.refresh()
    } catch {
      setError('바꾸지 못했습니다. 잠시 뒤 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'shipped') {
    return (
      <div className="flex flex-col gap-3 border border-gray-200 p-4">
        <button
          type="button"
          onClick={done}
          disabled={busy}
          className="bg-ink text-cloud text-caption self-start px-6 py-3 tracking-widest uppercase disabled:opacity-40"
        >
          {busy ? '바꾸는 중…' : '배송 완료로 바꾸기'}
        </button>
        {error ? <p className="text-caption text-red-600">{error}</p> : null}
      </div>
    )
  }

  if (status !== 'paid') return null

  return (
    <div className="flex flex-col gap-3 border border-gray-200 p-4">
      <p className="text-ink-subtle text-caption">
        편의점에서 접수하고 받은 송장번호를 넣어 주세요.
      </p>

      <div className="flex flex-wrap gap-2">
        <select
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          className="text-body border border-gray-300 bg-white px-3 py-2"
        >
          {CARRIERS.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          value={trackingNo}
          onChange={(e) => setTrackingNo(e.target.value)}
          placeholder="송장번호"
          inputMode="numeric"
          maxLength={20}
          className="text-body flex-1 border border-gray-300 bg-white px-3 py-2"
        />
      </div>

      {error ? (
        <p className="text-caption whitespace-pre-line text-red-600">{error}</p>
      ) : null}

      <button
        type="button"
        onClick={ship}
        disabled={busy || !trackingNo.trim()}
        className="bg-ink text-cloud text-caption self-start px-6 py-3 tracking-widest uppercase disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? '바꾸는 중…' : '보냈습니다'}
      </button>
    </div>
  )
}
