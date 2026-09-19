'use client'

import { useState } from 'react'
import Image from 'next/image'
import { imageUrl } from '@/lib/images'

/**
 * 상세 아래의 탭. **`Detail` 과 `Shipping & Returns` 둘이다.**
 * 옛 레포의 구조를 그대로 계승한다.
 *
 * `Detail` 은 상세 이미지를 세로로 쌓고, 없으면 설명 글을, 그것도 없으면
 * 준비 중이라고 알린다. 빈 화면을 그냥 두지 않는다.
 */

type Tab = 'detail' | 'shipping'

/**
 * ⚠️ **옛 버터웨더 사이트에 실제로 걸려 있던 값을 그대로 옮긴 것이다.**
 * 지어낸 값이 아니다 — 출처는 `butter-weather-shop` 의
 * `(shop)/products/[slug]/page.tsx` 다.
 *
 * **다만 지금도 유효한지는 확인받지 않았다.** 배송비·기간·교환 조건은
 * 손님과의 약속이라 틀리면 그대로 분쟁이 된다. 이나래 확인 전에는 이
 * 값을 근거로 다른 화면(주문서·안내 페이지)을 만들지 말 것.
 */
const SHIPPING = [
  {
    title: '배송 안내',
    rows: [
      ['배송 방법', '택배'],
      ['배송비', '3,000원 (50,000원 이상 무료)'],
      ['배송 기간', '결제 확인 후 2~5일 이내 출고'],
    ],
  },
  {
    title: '교환 · 반품 안내',
    rows: [
      ['신청 기간', '상품 수령 후 7일 이내'],
      ['반품 배송비', '단순 변심 시 왕복 배송비 고객 부담'],
      ['불가 사유', '착용·사용 흔적이 있거나 포장이 훼손된 경우'],
    ],
  },
]

export default function ProductTabs({
  detailImages,
  description,
  alt,
}: {
  detailImages: string[]
  description: string | null
  alt: string
}) {
  const [tab, setTab] = useState<Tab>('detail')

  return (
    <div>
      <div className="flex items-center justify-center gap-10 border-b border-gray-200">
        {(
          [
            { key: 'detail', label: 'Detail' },
            { key: 'shipping', label: 'Shipping & Returns' },
          ] as { key: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`text-caption -mb-px border-b py-5 tracking-widest uppercase transition-colors ${
              tab === t.key
                ? 'border-ink text-ink'
                : 'text-ink-subtle hover:text-ink border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 lg:py-20">
        {tab === 'detail' ? (
          detailImages.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              {detailImages.map((src, i) => (
                <Image
                  key={src}
                  src={imageUrl(src)}
                  alt={`${alt} 상세 이미지 ${i + 1}`}
                  width={768}
                  height={1024}
                  sizes="(max-width: 1024px) 100vw, 768px"
                  className="h-auto w-full"
                />
              ))}
            </div>
          ) : description ? (
            <p className="text-ink-muted text-body text-center leading-relaxed font-light whitespace-pre-line">
              {description}
            </p>
          ) : (
            <p className="text-ink-subtle text-caption text-center">
              상세 정보가 준비 중입니다.
            </p>
          )
        ) : (
          <div className="flex flex-col gap-8">
            {SHIPPING.map((block) => (
              <div key={block.title}>
                <p className="text-ink text-body mb-4 font-serif">
                  {block.title}
                </p>
                <dl className="flex flex-col">
                  {block.rows.map(([k, v]) => (
                    <div
                      key={k}
                      className="flex gap-6 border-t border-gray-200 py-3"
                    >
                      <dt className="text-ink-subtle text-caption w-28 shrink-0">
                        {k}
                      </dt>
                      <dd className="text-ink-muted text-caption">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
            <p className="text-ink-subtle text-caption leading-relaxed">
              핸드메이드 특성상 색상·크기에 미세한 차이가 있을 수 있으며, 이는
              교환·반품 사유에 해당하지 않습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
