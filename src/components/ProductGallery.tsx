'use client'

import { useState } from 'react'
import Image from 'next/image'
import { imageUrl } from '@/lib/images'

/**
 * 상세 화면의 사진. **큰 사진 하나 + 아래 줄지어 선 썸네일**이다.
 *
 * 계승한 디자인대로 **3:4 세로**를 지킨다 (CLAUDE.md 1절). 정사각으로
 * 바꾸지 말 것 — 목록의 상품 칸과 비율이 어긋난다.
 *
 * 썸네일은 격자선으로만 나누고 고른 것에 검은 테두리를 둔다. 그림자·둥근
 * 모서리를 쓰지 않는 것은 이 디자인의 성격이다.
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
    return <div className="aspect-3/4 w-full bg-gray-100" aria-hidden />
  }

  return (
    <div>
      <div className="relative aspect-3/4 w-full overflow-hidden bg-gray-100">
        <Image
          src={imageUrl(images[current])}
          alt={alt}
          fill
          // 상세의 주인공이라 첫 사진은 미루지 않고 바로 받는다
          priority={current === 0}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {/* 사진이 한 장뿐이면 썸네일 줄은 의미가 없다 */}
      {images.length > 1 ? (
        <div className="flex border-t border-gray-200">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`사진 ${i + 1}`}
              aria-current={i === current}
              className={`relative aspect-3/4 min-w-0 flex-1 border-r border-gray-200 last:border-r-0 ${
                i === current ? 'ring-ink ring-2 ring-inset' : ''
              }`}
            >
              <Image
                src={imageUrl(src)}
                alt=""
                fill
                sizes="20vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
