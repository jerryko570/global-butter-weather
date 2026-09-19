'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Label from '@/components/Label'
import ImageField from '@/components/admin/ImageField'
import { useToast } from '@/components/Toast'
import { LIMITS, validateProduct } from '@/lib/productLimits'
import {
  createProduct,
  updateProduct,
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
  const { show } = useToast()
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

  const [uploadNote, setUploadNote] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setVariant(i: number, patch: Partial<VariantInput>) {
    setVariants((vs) => vs.map((v, j) => (i === j ? { ...v, ...patch } : v)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // DB 의 CHECK 제약과 같은 값을 미리 본다. 저장을 눌렀다가 DB 에서
    // 튕기면 어느 칸이 문제인지 알 수 없다 (schema.md 7-2절).
    const problems = validateProduct({
      slug,
      name,
      nameEn,
      description,
      images,
      variants,
    })
    if (problems.length > 0) {
      setError(problems.join('\n'))
      show('저장하지 못했습니다', 'fail')
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
      // 목록으로 옮기면 폼이 사라지므로, 무엇이 됐는지는 알림으로 남긴다
      show(initial ? '저장했습니다' : '등록했습니다')
      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : '저장하지 못했습니다.'
      setError(msg)
      show(msg, 'fail')
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
            maxLength={LIMITS.name.max}
            required
          />
        </Field>
        <Field label="이름 (영문)">
          <input
            className={inputClass}
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            maxLength={LIMITS.nameEn.max}
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
          minLength={LIMITS.slug.min}
          maxLength={LIMITS.slug.max}
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
          maxLength={LIMITS.description.max}
        />
      </Field>

      {/* ───── 사진 ───── */}
      <ImageField
        slug={slug}
        images={images}
        onChange={setImages}
        onNotice={(t) => {
          setUploadNote(t)
          show(t)
        }}
        onError={setError}
        disabled={saving}
      />
      {uploadNote ? (
        <p className="text-ink-muted text-caption -mt-6">{uploadNote}</p>
      ) : null}

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
                maxLength={LIMITS.variantName.max}
                value={v.name}
                onChange={(e) => setVariant(i, { name: e.target.value })}
              />
              <input
                className={inputClass}
                placeholder="영문 이름"
                maxLength={LIMITS.variantNameEn.max}
                value={v.name_en ?? ''}
                onChange={(e) => setVariant(i, { name_en: e.target.value })}
              />
              <input
                className={inputClass}
                type="number"
                min={LIMITS.priceKrw.min}
                max={LIMITS.priceKrw.max}
                placeholder="가격 (원)"
                value={v.price_krw}
                onChange={(e) =>
                  setVariant(i, { price_krw: Number(e.target.value) })
                }
              />
              <input
                className={inputClass}
                type="number"
                min={LIMITS.stock.min}
                max={LIMITS.stock.max}
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
        <p className="text-caption border border-red-200 bg-red-50 p-3 whitespace-pre-line text-red-600">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
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
