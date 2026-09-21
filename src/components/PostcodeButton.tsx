'use client'

import { useState } from 'react'

/**
 * 우편번호 찾기. **카카오(옛 다음) 우편번호 서비스**를 띄운다.
 *
 * [공식 안내](https://postcode.map.kakao.com/guide)에 「Key를 발급 받을
 * 필요가 없습니다」라고 되어 있다. **API 키가 없다.**
 *
 * ⚠️ 이름이 \`daum.Postcode\` 에서 **\`kakao.Postcode\`** 로 바뀌었다.
 * 인터넷에 도는 예제는 대부분 옛 이름이라 그대로 베끼면 안 된다.
 * 스크립트 주소도 `t1.daumcdn.net` 이 아니라 `t1.kakaocdn.net` 이다.
 *
 * **스크립트를 미리 싣지 않는다.** 주문서에 들어온 사람 중에도 이 버튼을
 * 누르지 않는 사람이 있다. 누를 때 한 번만 받고, 그다음부터는 이미 있는
 * 것을 쓴다.
 */

const SRC =
  'https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

type PostcodeResult = {
  zonecode: string
  roadAddress: string
  jibunAddress: string
  buildingName: string
  userSelectedType: 'R' | 'J'
}

declare global {
  interface Window {
    kakao?: {
      Postcode: new (options: {
        oncomplete: (data: PostcodeResult) => void
      }) => { open: () => void }
    }
  }
}

/** 이미 실려 있으면 그대로 쓴다. 두 번 받지 않는다 */
function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject()
  if (window.kakao?.Postcode) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SRC}"]`
    )
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject())
      return
    }

    const el = document.createElement('script')
    el.src = SRC
    el.async = true
    el.onload = () => resolve()
    el.onerror = () => reject()
    document.head.appendChild(el)
  })
}

export default function PostcodeButton({
  onSelect,
}: {
  onSelect: (value: { zipcode: string; address: string }) => void
}) {
  const [busy, setBusy] = useState(false)

  async function open() {
    setBusy(true)
    try {
      await loadScript()
      new window.kakao!.Postcode({
        oncomplete: (data) => {
          // 손님이 도로명을 골랐으면 도로명, 지번을 골랐으면 지번을 쓴다.
          // 고른 것을 무시하고 한쪽으로 바꾸면 「내가 고른 게 아닌데」가 된다
          const base =
            data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress
          // 건물명이 있으면 붙여준다. 배송 기사가 찾기 쉬워진다
          const withBuilding = data.buildingName
            ? `${base} (${data.buildingName})`
            : base

          onSelect({ zipcode: data.zonecode, address: withBuilding })
        },
      }).open()
    } catch {
      // 못 받았으면 손으로 쓰면 된다. 주소 칸은 잠겨 있지 않다
      window.alert(
        '우편번호 찾기를 불러오지 못했습니다. 주소를 직접 입력해 주세요.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={busy}
      className="text-ink hover:border-ink text-caption shrink-0 border border-gray-300 px-4 py-2 tracking-widest uppercase transition-colors disabled:opacity-40"
    >
      {busy ? '여는 중…' : '우편번호 찾기'}
    </button>
  )
}
