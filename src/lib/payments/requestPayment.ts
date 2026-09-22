'use client'

import * as PortOne from '@portone/browser-sdk/v2'

/**
 * 결제창을 띄운다. **브라우저 쪽 절반이다.**
 *
 * 나머지 절반은 서버가 한다 — 여기서 「성공」이 돌아와도 **믿지 않고**
 * 서버가 포트원에 직접 물어본다 (`checkout/payment.ts`).
 *
 * ⚠️ **금액을 여기서 정하는 것처럼 보이지만 아니다.** `totalKrw` 는 서버가
 * 만들어 준 값이고, 결제가 끝난 뒤 서버가 **DB 의 총액과 다시 대조**한다.
 * 여기서 숫자를 바꿔도 확정되지 않는다.
 *
 * 채널(어느 PG 로 갈지)은 **콘솔에서 정하고 코드는 모른다.**
 * 토스페이먼츠 채널로 시작한다 (docs/plan/payment-providers.md).
 */

export type PayResult = { ok: true } | { ok: false; reason: string }

export async function payWithPortOne(input: {
  paymentId: string
  orderName: string
  totalKrw: number
  customer: { fullName: string; phoneNumber: string }
}): Promise<PayResult> {
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY

  if (!storeId || !channelKey) {
    return {
      ok: false,
      reason:
        '결제 설정이 되어 있지 않습니다. NEXT_PUBLIC_PORTONE_STORE_ID 와 NEXT_PUBLIC_PORTONE_CHANNEL_KEY 를 넣어 주세요.',
    }
  }

  try {
    const response = await PortOne.requestPayment({
      storeId,
      channelKey,
      paymentId: input.paymentId,
      orderName: input.orderName,
      totalAmount: input.totalKrw,
      currency: PortOne.Entity.Currency.KRW,
      payMethod: 'CARD',
      customer: {
        fullName: input.customer.fullName,
        phoneNumber: input.customer.phoneNumber,
      },
    })

    // **`code` 가 있으면 실패나 취소다.** 성공일 때는 없다
    if (response?.code !== undefined) {
      return { ok: false, reason: response.message ?? '결제가 취소되었습니다.' }
    }

    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : '결제창을 열지 못했습니다.',
    }
  }
}
