'use client'

import { useState } from 'react'
import Image from 'next/image'
import { imageUrl } from '@/lib/images'

/**
 * 상세 화면의 사진. **큰 사진 하나 + 아래 작은 썸네일 줄**이다.
 *
 * ⚠️ **메인 사진은 정사각이다.** 목록의 상품 칸은 3:4 세로인데 상세는
 * 정사각이다 — 옛 레포에서 일부러 나눠 둔 것이라 그대로 계승한다
 * (`(shop)/products/[slug]/page.tsx` 는 `aspect-square`, `(shop)/page.tsx`
 * 와 `products/page.tsx` 는 `aspect-3/4`). 3:4 로 맞추지 말 것.
 *
 * 썸네일은 **64×64 정사각을 왼쪽에 줄지어** 놓는다. 고른 것에 얇은 테두리를
 * 두고 나머지는 흐리게 한다. 전체 폭을 나눠 크게 깔면 사진이 두 벌처럼
 * 보여 메인이 주인공 자리를 잃는다.
 */
export default function ProductGallery({
  images,
  alt,
}: {
  images: string[]
  alt: string
}) {
  const [current, setCurrent] = useState(0)

  if (images.length === 0) {
    return <div className="aspect-square w-full bg-gray-100" aria-hidden />
  }

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        <Image
          src={imageUrl(images[current])}
          alt={alt}
          fill
          // 상세의 주인공이라 미루지 않고 바로 받는다
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {/* 사진이 한 장뿐이면 썸네일 줄은 의미가 없다 */}
      {images.length > 1 ? (
        <div className="flex flex-wrap gap-2 border-t border-gray-200 p-4">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`사진 ${i + 1}`}
              aria-current={i === current}
              className={`relative h-16 w-16 overflow-hidden bg-gray-100 transition-opacity ${
                i === current
                  ? 'ring-ink ring-1'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={imageUrl(src)}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
