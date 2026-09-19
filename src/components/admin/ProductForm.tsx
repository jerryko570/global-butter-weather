'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Label from '@/components/Label'
import { imageUrl } from '@/lib/images'
import { compressImage, formatBytes } from '@/lib/compressImage'
import {
  createProduct,
  updateProduct,
  uploadProductImages,
  type ProductInput,
  type VariantInput,
} from '@/lib/queries/adminProducts'
import { revalidateShop } from '@/app/admin/actions'
import type { ProductCategory, ProductDetail } from '@/types/product'

/**
 * 상품 등록·수정 폼. **한 벌로 둘 다 한다** — 옛 레포와 같다. 화면을
 * 나누면 칸이 하나 늘 때마다 두 군데를 고쳐야 한다.
 *
 * 옛 것과 크게 다른 곳이 하나 있다. **옵션(variant)** 이다. 옛 쪽은 가격·
 * 재고가 상품에 붙어 있어 칸 두 개면 됐는데, 여기서는 옵션마다 값이 달라
 * 줄을 여러 개 다룬다 (schema.md 1절).
 *
 * ⚠️ **사진은 slug 를 채워야 올릴 수 있다.** 버킷 폴더 이름이 slug 이기
 * 때문이다 (schema.md 7절). 먼저 올리게 두면 사진이 어디로 갈지 정할 수
 * 없다.
 */

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'keyring', label: '키링' },
  { value: 'bracelet', label: '팔찌' },
  { value: 'necklace', label: '목걸이' },
]

/** 옵션이 없는 상품은 화면에 안 나온다. 새 상품은 빈 줄 하나로 시작한다 */
const EMPTY_VARIANT: VariantInput = {
  name: '',
  name_en: null,
  price_krw: 0,
  stock: 0,
  position: 0,
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

const inputClass =
  'text-ink text-body w-full border border-gray-300 px-3 py-2 focus:border-ink focus:outline-none'

export default function ProductForm({
  initial,
}: {
  /** 없으면 등록, 있으면 수정 */
  initial?: ProductDetail
}) {
  const router = useRouter()
  const editing = Boolean(initial)

  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [nameEn, setNameEn] = useState(initial?.name_en ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState<ProductCategory>(
    initial?.category ?? 'keyring'
  )
  const [images, setImages] = useState<string[]>(initial?.images ?? [])
  const [isActive, setIsActive] = useState(initial?.is_active ?? false)
  const [variants, setVariants] = useState<VariantInput[]>(
    initial?.variants.map((v) => ({
      id: v.id,
      name: v.name,
      name_en: v.name_en,
      price_krw: v.price_krw,
      stock: v.stock,
      position: v.position,
    })) ?? [{ ...EMPTY_VARIANT }]
  )

  const [uploading, setUploading] = useState(false)
  const [uploadNote, setUploadNote] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setVariant(i: number, patch: Partial<VariantInput>) {
    setVariants((vs) => vs.map((v, j) => (i === j ? { ...v, ...patch } : v)))
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setError(null)
    setUploadNote(null)
    setUploading(true)
    try {
      // 1. 먼저 줄인다. 폰 사진은 5MB 를 넘는데 화면에서 가장 큰 자리가
      //    1000px 이 안 된다. 원본을 그대로 올리면 이 구간이 제일 느리다.
      const before = files.reduce((n, f) => n + f.size, 0)
      const shrunk = await Promise.all(files.map(compressImage))
      const after = shrunk.reduce((n, f) => n + f.size, 0)

      // 2. 한 번에 올린다. 장마다 부르면 폴더 목록을 그때마다 다시 읽는다
      const paths = await uploadProductImages(slug, shrunk)
      setImages((prev) => [...prev, ...paths])

      setUploadNote(
        after < before
          ? `${files.length}장 올렸습니다 — ${formatBytes(before)} → ${formatBytes(after)}`
          : `${files.length}장 올렸습니다 — ${formatBytes(after)}`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : '사진을 올리지 못했습니다.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (variants.length === 0 || variants.some((v) => !v.name.trim())) {
      setError(
        '옵션 이름을 채워 주세요. 옵션이 없는 상품은 화면에 나오지 않습니다.'
      )
      return
    }

    const input: ProductInput = {
      slug: slug.trim(),
      name: name.trim(),
      name_en: nameEn.trim() || null,
      description: description.trim() || null,
      description_en: null,
      category,
      tags: [],
      images,
      detail_images: initial?.detail_images ?? [],
      status: 'active',
      is_active: isActive,
    }

    setSaving(true)
    try {
      if (initial) {
        await updateProduct(initial.id, input, variants)
      } else {
        await createProduct(input, variants)
      }
      // 가게 화면은 60초 주기로 굽는다. 바꾼 즉시 보이도록 깨운다
      await revalidateShop()
      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="이름 (국문) *">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field label="이름 (영문)">
          <input
            className={inputClass}
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
          />
        </Field>
      </div>

      <Field
        label="slug *"
        hint="주소와 사진 폴더 이름이 됩니다. 영문 소문자·숫자·하이픈만. 한 번 정하면 바꾸기 번거롭습니다."
      >
        <input
          className={inputClass}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          pattern="[a-z0-9-]+"
          required
        />
      </Field>

      <Field label="카테고리 *" hint="소재가 아니라 형태로 나눕니다.">
        <select
          className={inputClass}
          value={category}
          onChange={(e) => setCategory(e.target.value as ProductCategory)}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="설명">
        <textarea
          className={`${inputClass} min-h-24`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      {/* ───── 사진 ───── */}
      <Field
        label="사진"
        hint={
          slug
            ? `product-images/${slug}/ 아래에 01, 02… 로 올라갑니다. 첫 장이 대표입니다.`
            : 'slug 를 먼저 입력해 주세요. 그 이름으로 폴더가 만들어집니다.'
        }
      >
        <div className="flex flex-wrap gap-2">
          {images.map((path, i) => (
            <div
              key={path}
              className="relative h-20 w-20 overflow-hidden border border-gray-200 bg-gray-100"
            >
              <Image
                src={imageUrl(path)}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
              {i === 0 ? (
                <span className="bg-ink text-cloud text-label absolute top-0 left-0 px-1">
                  대표
                </span>
              ) : null}
              <button
                type="button"
                onClick={() =>
                  setImages((prev) => prev.filter((p) => p !== path))
                }
                aria-label="사진 빼기"
                className="text-ink absolute right-0 bottom-0 bg-white/90 px-1 text-xs"
              >
                ×
              </button>
            </div>
          ))}

          <label
            className={`text-caption flex h-20 w-20 items-center justify-center border border-dashed text-center ${
              slug
                ? 'hover:border-ink text-ink-muted cursor-pointer border-gray-300'
                : 'text-ink-subtle cursor-not-allowed border-gray-200'
            }`}
          >
            {uploading ? '올리는 중…' : slug ? '+ 사진' : 'slug 먼저'}
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={!slug || uploading}
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>
      </Field>
      <div className="-mt-6 flex flex-col gap-1">
        {uploadNote ? (
          <p className="text-ink-muted text-caption">{uploadNote}</p>
        ) : null}
        <p className="text-ink-subtle text-caption">
          ⚠️ 사진을 여기서 빼도 저장소의 파일은 지워지지 않습니다. 화면에서만
          빠집니다.
        </p>
        <p className="text-ink-subtle text-caption">
          올리기 전에 긴 변 1600px 으로 줄입니다. 원본은 저장하지 않습니다.
        </p>
      </div>

      {/* ───── 옵션 ───── */}
      <Field
        label="옵션 *"
        hint="가격과 재고는 옵션에 붙습니다. 옵션이 하나뿐인 물건도 한 줄은 있어야 합니다."
      >
        <div className="flex flex-col gap-3">
          {/*
            가격·재고 칸은 숫자 0 이 들어 있어 placeholder 가 안 보인다.
            머리글이 없으면 어느 칸이 무엇인지 알 수 없다.
          */}
          <div className="hidden gap-2 px-3 sm:grid sm:grid-cols-5">
            {['이름 *', '영문 이름', '가격 (원)', '재고', ''].map((h, i) => (
              <Label key={i}>{h}</Label>
            ))}
          </div>

          {variants.map((v, i) => (
            <div
              key={v.id ?? `new-${i}`}
              className="grid grid-cols-2 gap-2 border border-gray-200 p-3 sm:grid-cols-5"
            >
              <input
                className={inputClass}
                placeholder="이름 *"
                value={v.name}
                onChange={(e) => setVariant(i, { name: e.target.value })}
              />
              <input
                className={inputClass}
                placeholder="영문 이름"
                value={v.name_en ?? ''}
                onChange={(e) => setVariant(i, { name_en: e.target.value })}
              />
              <input
                className={inputClass}
                type="number"
                min={0}
                placeholder="가격 (원)"
                value={v.price_krw}
                onChange={(e) =>
                  setVariant(i, { price_krw: Number(e.target.value) })
                }
              />
              <input
                className={inputClass}
                type="number"
                min={0}
                placeholder="재고"
                value={v.stock}
                onChange={(e) =>
                  setVariant(i, { stock: Number(e.target.value) })
                }
              />
              <button
                type="button"
                onClick={() =>
                  setVariants((vs) => vs.filter((_, j) => j !== i))
                }
                disabled={variants.length === 1}
                className="text-ink-subtle hover:text-ink text-caption border border-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                빼기
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setVariants((vs) => [
                ...vs,
                { ...EMPTY_VARIANT, position: vs.length },
              ])
            }
            className="text-ink-muted hover:border-ink text-caption w-fit border border-dashed border-gray-300 px-4 py-2"
          >
            + 옵션 추가
          </button>
        </div>
      </Field>

      {/* ───── 노출 ───── */}
      <Field
        label="노출"
        hint="꺼두면 손님에게 보이지 않습니다. 주소를 직접 쳐도 안 보입니다."
      >
        <label className="text-ink text-body flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          가게에 보이기
        </label>
      </Field>

      {error ? (
        <p className="text-caption border border-red-200 bg-red-50 p-3 text-red-600">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || uploading}
          className="bg-ink text-cloud text-caption px-7 py-3 tracking-widest uppercase disabled:opacity-40"
        >
          {saving ? '저장 중…' : editing ? '저장' : '등록'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="text-ink hover:border-ink text-caption border border-gray-300 px-7 py-3 tracking-widest uppercase"
        >
          취소
        </button>
      </div>
    </form>
  )
}
