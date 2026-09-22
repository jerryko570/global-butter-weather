'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Label from '@/components/Label'
import PostcodeButton from '@/components/PostcodeButton'
import { useToast } from '@/components/Toast'
import { imageUrl } from '@/lib/images'
import { formatKRW } from '@/lib/queries/products'
import { cartTotalKrw, useCart, useCartLines } from '@/lib/store/cart'
import { amountUntilFreeShipping, shippingFee } from '@/lib/shipping'
import { createOrder } from './actions'
import { confirmPayment, preparePayment } from './payment'
import { payWithPortOne } from '@/lib/payments/requestPayment'
import type { ShippingInfo } from '@/types/order'

/**
 * 주문서. **배송지 · 주문 상품 · 동의** 셋으로 나뉜다. 옛 레포의 설계
 * 문서가 정해둔 구획이다 (`docs/design/checkout-data-model.md`).
 *
 * ⚠️ **여기 보이는 합계는 보여주기 위한 것이다.** 실제 금액은 서버가
 * DB 에서 다시 읽어 센다 (`actions.ts`). 둘이 다르면 **서버가 맞다.**
 *
 * **배송지를 회원 정보에서 끌어오지 않는다.** OAuth 는 이름과 이메일만
 * 주고, 주소는 어차피 주문마다 다를 수 있다 (schema.md 7-3절).
 */

const inputClass =
  'text-ink text-body w-full border border-gray-300 px-3 py-2.5 focus:border-ink focus:outline-none'

const EMPTY: ShippingInfo = {
  name: '',
  phone: '',
  zipcode: '',
  address: '',
  addressDetail: '',
  memo: '',
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <Label className="mb-2">{label}</Label>
      {children}
      {hint ? (
        <p className="text-ink-subtle text-caption mt-1">{hint}</p>
      ) : null}
    </div>
  )
}

export default function CheckoutForm() {
  const router = useRouter()
  const { show } = useToast()
  const lines = useCartLines()
  const clear = useCart((s) => s.clear)
  const remove = useCart((s) => s.remove)

  const [shipping, setShipping] = useState<ShippingInfo>(EMPTY)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  const [saving, setSaving] = useState(false)
  // 주문이 만들어지고 화면이 옮겨가는 사이. **이게 없으면 장바구니를
  // 비우는 순간 「담긴 것이 없습니다」가 한 번 번쩍인다** (2026-09-22)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gone, setGone] = useState<string[]>([])

  // **보여주기 위한 계산이다.** 저장되는 값은 서버가 센다(actions.ts).
  // 같은 함수를 쓰므로 어긋날 일은 없지만, 다르면 서버가 맞다
  const itemsKrw = cartTotalKrw(lines)
  const shippingKrw = shippingFee(itemsKrw)
  const total = itemsKrw + shippingKrw
  const untilFree = amountUntilFreeShipping(itemsKrw)

  function set(patch: Partial<ShippingInfo>) {
    setShipping((s) => ({ ...s, ...patch }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!agreePrivacy) {
      setError('개인정보 수집·이용에 동의해 주세요.')
      return
    }

    setSaving(true)
    try {
      // **가격을 보내지 않는다.** 어느 옵션을 몇 개인지만 보낸다
      const result = await createOrder(
        lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        shipping,
        agreeMarketing
      )

      if (!result.ok) {
        // 서버는 **조회되지 않는 줄의 이름을 모른다.** 장바구니가 알고
        // 있으므로 여기서 붙인다
        const gone = result.goneVariantIds ?? []
        const names = lines
          .filter((l) => gone.includes(l.variantId))
          .map((l) => `${l.productName} ${l.variantName}`)

        setError(
          names.length > 0
            ? [
                result.reason,
                '',
                ...names,
                '',
                '아래 「살 수 없는 것 빼기」를 누르시면 정리됩니다.',
              ].join('\n')
            : result.reason
        )
        setGone(gone)
        show('주문하지 못했습니다', 'fail')
        return
      }

      // ── 결제 ───────────────────────────────────────────
      // 주문서(pending)가 만들어졌다. 이제 돈을 받는다.
      // **실패해도 주문은 남는다** — 주문 내역에서 다시 결제할 수 있다
      const prepared = await preparePayment(result.orderNo)
      if (!prepared.ok) {
        setError(prepared.reason)
        show('결제를 준비하지 못했습니다', 'fail')
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
        // 취소도 여기로 온다. 주문은 pending 으로 남아 있다
        setError(
          `${paid.reason}
주문서는 만들어졌습니다 — 주문 내역에서 다시 결제하실 수 있습니다.`
        )
        show('결제가 완료되지 않았습니다', 'fail')
        setDone(true)
        clear()
        router.push(`/orders/${result.orderNo}`)
        return
      }

      // **화면 말을 믿지 않는다.** 서버가 포트원에 직접 물어본다
      const confirmed = await confirmPayment(result.orderNo)
      if (!confirmed.ok) {
        setError(confirmed.reason)
        show('주문을 완료하지 못했습니다', 'fail')
        setDone(true)
        clear()
        router.push(`/orders/${result.orderNo}`)
        return
      }

      // 주문이 만들어진 뒤에 비운다. 먼저 비우면 실패했을 때 담은 것이
      // 사라진다
      setDone(true)
      clear()
      router.push(`/orders/${result.orderNo}`)
    } catch {
      setError('주문하지 못했습니다. 잠시 뒤 다시 시도해 주세요.')
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="border-b border-gray-200 px-7 py-24 text-center">
        <p className="text-ink-muted text-body">주문 내역을 여는 중…</p>
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="border-b border-gray-200 px-7 py-24 text-center">
        <p className="text-ink-muted text-body mb-8">담긴 것이 없습니다.</p>
        <Link
          href="/"
          className="bg-ink text-cloud text-caption px-7 py-3 tracking-widest uppercase"
        >
          상품 보러 가기
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 border-b border-gray-200 lg:grid-cols-2">
        {/* ───── 배송지 ───── */}
        <div className="flex flex-col gap-6 border-b border-gray-200 p-8 lg:border-r lg:border-b-0 lg:p-12">
          <h2 className="text-ink text-title font-serif">배송지</h2>

          <Field label="받는 분 *">
            <input
              className={inputClass}
              value={shipping.name}
              onChange={(e) => set({ name: e.target.value })}
              maxLength={40}
              required
            />
          </Field>

          <Field label="연락처 *" hint="배송 안내를 이 번호로 보냅니다.">
            <input
              className={inputClass}
              value={shipping.phone}
              onChange={(e) => set({ phone: e.target.value })}
              inputMode="tel"
              maxLength={20}
              required
            />
          </Field>

          <Field label="주소 *">
            <div className="flex gap-2">
              <input
                className={`${inputClass} max-w-32`}
                value={shipping.zipcode}
                onChange={(e) => set({ zipcode: e.target.value })}
                placeholder="우편번호"
                maxLength={10}
                required
              />
              <PostcodeButton
                onSelect={({ zipcode, address }) => set({ zipcode, address })}
              />
            </div>
            <input
              className={`${inputClass} mt-2`}
              value={shipping.address}
              onChange={(e) => set({ address: e.target.value })}
              placeholder="주소"
              maxLength={200}
              required
            />
            <input
              className={`${inputClass} mt-2`}
              value={shipping.addressDetail}
              onChange={(e) => set({ addressDetail: e.target.value })}
              placeholder="상세 주소 (동·호수)"
              maxLength={100}
            />
          </Field>

          <Field label="배송 메모">
            <input
              className={inputClass}
              value={shipping.memo}
              onChange={(e) => set({ memo: e.target.value })}
              placeholder="문 앞에 놓아 주세요"
              maxLength={100}
            />
          </Field>
        </div>

        {/* ───── 주문 상품 · 동의 ───── */}
        <div className="flex flex-col gap-8 p-8 lg:p-12">
          <div>
            <h2 className="text-ink text-title mb-6 font-serif">주문 상품</h2>
            <div className="flex flex-col">
              {lines.map((l) => (
                <div
                  key={l.variantId}
                  className="flex items-center gap-3 border-t border-gray-200 py-3"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-gray-100">
                    {l.image ? (
                      <Image
                        src={imageUrl(l.image)}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-ink text-caption truncate">
                      {l.productName}
                    </p>
                    <p className="text-ink-subtle text-caption">
                      {l.variantName} · {l.quantity}개
                    </p>
                  </div>
                  <p className="text-ink text-caption shrink-0">
                    {formatKRW(l.priceKrw * l.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-baseline justify-between border-t border-gray-200 pt-3">
              <Label>상품</Label>
              <p className="text-ink-muted text-caption">
                {formatKRW(itemsKrw)}
              </p>
            </div>
            <div className="flex items-baseline justify-between py-1">
              <Label>배송비</Label>
              <p className="text-ink-muted text-caption">
                {shippingKrw === 0 ? '무료' : formatKRW(shippingKrw)}
              </p>
            </div>
            <div className="flex items-baseline justify-between border-t border-gray-200 pt-3">
              <Label>Total</Label>
              <p className="text-ink text-title font-medium">
                {formatKRW(total)}
              </p>
            </div>
            {untilFree > 0 ? (
              <p className="text-ink-subtle text-caption mt-2">
                {formatKRW(untilFree)} 더 담으면 배송비가 무료입니다.
              </p>
            ) : null}
          </div>

          {/* ───── 동의 ───── */}
          <div className="flex flex-col gap-3 border-t border-gray-200 pt-6">
            <label className="text-ink text-caption flex items-start gap-2">
              <input
                type="checkbox"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <strong>[필수]</strong> 개인정보 수집·이용에 동의합니다.
                <span className="text-ink-subtle block">
                  배송을 위해 받는 분·연락처·주소를 수집하며, 배송 완료 후 관련
                  법령에 따라 보관합니다.
                </span>
              </span>
            </label>

            <label className="text-ink text-caption flex items-start gap-2">
              <input
                type="checkbox"
                checked={agreeMarketing}
                onChange={(e) => setAgreeMarketing(e.target.checked)}
                className="mt-0.5"
              />
              <span>[선택] 새 상품 소식을 받아보겠습니다.</span>
            </label>
          </div>

          {error ? (
            <div className="border border-red-200 bg-red-50 p-3">
              <p className="text-caption whitespace-pre-line text-red-600">
                {error}
              </p>
              {gone.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    gone.forEach((id) => remove(id))
                    setGone([])
                    setError(null)
                  }}
                  className="text-caption mt-3 border border-red-300 px-4 py-2 text-red-600 hover:bg-white"
                >
                  살 수 없는 것 빼기
                </button>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="bg-ink text-cloud text-caption w-full py-3.5 tracking-widest uppercase disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? '결제를 여는 중…' : '결제하기'}
          </button>
          <p className="text-ink-subtle text-caption">
            아직 결제는 진행되지 않습니다. 주문서만 만들어지고, 결제는 준비되는
            대로 붙습니다.
          </p>
        </div>
      </div>
    </form>
  )
}
