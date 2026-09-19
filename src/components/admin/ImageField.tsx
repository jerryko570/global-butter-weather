'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Label from '@/components/Label'
import { imageUrl } from '@/lib/images'
import { compressImage, formatBytes } from '@/lib/compressImage'
import { uploadProductImages } from '@/lib/queries/adminProducts'

/**
 * 사진 칸. 고르기·끌어다 놓기·순서 바꾸기·대표 지정을 맡는다.
 *
 * **첫 장이 대표다.** 따로 「대표」 표시를 저장하지 않는다 — `images[0]` 이
 * 목록과 상세의 첫 사진이라는 규칙이 이미 있고(schema.md 7절), 표시를
 * 따로 두면 순서와 어긋날 수 있다. **대표를 바꾸는 것은 맨 앞으로 옮기는
 * 것이다.**
 *
 * ⚠️ **slug 를 채워야 올릴 수 있다.** 버킷 폴더 이름이 slug 다.
 */
export default function ImageField({
  slug,
  images,
  onChange,
  onNotice,
  onError,
  disabled,
}: {
  slug: string
  images: string[]
  onChange: (next: string[]) => void
  onNotice: (text: string) => void
  onError: (text: string) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const locked = disabled || !slug || uploading

  async function accept(files: File[]) {
    const picked = files.filter((f) => f.type.startsWith('image/') || !f.type)
    if (picked.length === 0) return

    setUploading(true)
    try {
      const before = picked.reduce((n, f) => n + f.size, 0)
      const results = await Promise.all(picked.map(compressImage))

      // 못 읽는 파일은 **올리지 않는다.** 올려 두면 화면에서 엑스박스가 된다
      const usable = results.flatMap((r) => (r.ok ? [r.file] : []))
      const failed = results.flatMap((r) => (r.ok ? [] : [r]))

      if (usable.length > 0) {
        const after = usable.reduce((n, f) => n + f.size, 0)
        const paths = await uploadProductImages(slug, usable)
        onChange([...images, ...paths])
        onNotice(
          `${usable.length}장 올렸습니다 — ${formatBytes(before)} → ${formatBytes(after)}`
        )
      }

      if (failed.length > 0) {
        onError(failed.map((f) => `${f.name} — ${f.reason}`).join('\n'))
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : '사진을 올리지 못했습니다.')
    } finally {
      setUploading(false)
    }
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= images.length) return
    const next = [...images]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <div>
      <Label className="mb-2">사진</Label>

      {/*
        끌어다 놓는 자리. 클릭해도 파일 고르기가 열린다.
        dragOver 에서 preventDefault 를 하지 않으면 브라우저가 파일을
        새 탭으로 열어버린다.
      */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!locked) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (locked) return
          void accept(Array.from(e.dataTransfer.files))
        }}
        onClick={() => !locked && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        className={`text-caption flex min-h-24 items-center justify-center border border-dashed px-4 py-6 text-center ${
          locked
            ? 'text-ink-subtle cursor-not-allowed border-gray-200'
            : dragging
              ? 'border-ink text-ink bg-gray-50'
              : 'text-ink-muted hover:border-ink cursor-pointer border-gray-300'
        }`}
      >
        {uploading
          ? '올리는 중…'
          : !slug
            ? 'slug 를 먼저 입력해 주세요. 그 이름으로 폴더가 만들어집니다.'
            : dragging
              ? '놓으면 올라갑니다'
              : '사진을 끌어다 놓거나 눌러서 고르세요'}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={locked}
          onChange={(e) => {
            void accept(Array.from(e.target.files ?? []))
            e.target.value = ''
          }}
          className="hidden"
        />
      </div>

      {images.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-3">
          {images.map((path, i) => (
            <div key={path} className="w-24">
              <div className="relative h-24 w-24 overflow-hidden border border-gray-200 bg-gray-100">
                <Image
                  src={imageUrl(path)}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
                {i === 0 ? (
                  <span className="bg-ink text-cloud text-label absolute top-0 left-0 px-1">
                    대표
                  </span>
                ) : null}
              </div>

              <div className="mt-1 flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  aria-label="앞으로"
                  className="text-ink-subtle hover:text-ink text-caption disabled:opacity-30"
                >
                  ←
                </button>
                {i === 0 ? (
                  <span className="text-ink-subtle text-caption">첫 장</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => move(i, 0)}
                    className="text-ink-muted hover:text-ink text-caption underline"
                  >
                    대표로
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === images.length - 1}
                  aria-label="뒤로"
                  className="text-ink-subtle hover:text-ink text-caption disabled:opacity-30"
                >
                  →
                </button>
              </div>

              <button
                type="button"
                onClick={() => onChange(images.filter((p) => p !== path))}
                className="text-ink-subtle text-caption mt-1 w-full hover:text-red-600"
              >
                빼기
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-2 flex flex-col gap-1">
        <p className="text-ink-subtle text-caption">
          <span className="text-ink-muted">첫 장이 대표입니다.</span>{' '}
          「대표로」를 누르면 맨 앞으로 옮겨집니다.
        </p>
        <p className="text-ink-subtle text-caption">
          올리기 전에 긴 변 1600px JPEG 로 바꿉니다 — HEIC 처럼 웹이 못 읽는
          형식도 이때 바뀝니다. 원본은 저장하지 않습니다.
        </p>
        <p className="text-ink-subtle text-caption">
          ⚠️ 여기서 빼도 저장소의 파일은 지워지지 않습니다. 화면에서만 빠집니다.
        </p>
      </div>
    </div>
  )
}
