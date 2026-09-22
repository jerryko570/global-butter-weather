'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { payWithPortOne } from '@/lib/payments/requestPayment'
import { confirmPayment, preparePayment } from '@/app/(shop)/checkout/payment'
import type { ShippingInfo } from '@/types/order'

/**
 * 결제가 안 끝난 주문을 다시 결제한다.
 *
 * **결제가 실패해도 주문은 남는다.** 그게 없으면 손님은 처음부터 다시
 * 담아야 한다 — 그런데 장바구니는 이미 비워져 있다.
 *
 * `preparePayment` 가 **번호를 새로 발급한다.** 포트원은 한 번 쓴 번호를
 * 다시 받아주지 않는다.
 */
export default function RetryPaymentButton({
  orderNo,
  shipping,
}: {
  orderNo: string
  shipping: ShippingInfo
}) {
  const router = useRouter()
  const { show } = useToast()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setError(null)
    setBusy(true)
    try {
      const prepared = await preparePayment(orderNo)
      if (!prepared.ok) {
        setError(prepared.reason)
        return
      }

      const paid = await payWithPortOne({
        paymentId: prepared.paymentId,
        orderName: prepared.orderName,
        totalKrw: prepared.totalKrw,
        customer: {
          fullName: shipping.name,
          phoneNumber: shipping.phone,
        },
      })
      if (!paid.ok) {
        setError(paid.reason)
        return
      }

      const confirmed = await confirmPayment(orderNo)
      if (!confirmed.ok) {
        setError(confirmed.reason)
        return
      }

      show('결제가 완료되었습니다')
      router.refresh()
    } catch {
      setError('결제하지 못했습니다. 잠시 뒤 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="bg-ink text-cloud text-caption px-10 py-3.5 tracking-widest uppercase disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? '결제를 여는 중…' : '결제하기'}
      </button>
      {error ? (
        <p className="text-caption border border-red-200 bg-red-50 p-3 whitespace-pre-line text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}
