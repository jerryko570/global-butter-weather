import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Label from '@/components/Label'
import ProductGallery from '@/components/ProductGallery'
import VariantPicker from '@/components/VariantPicker'
import { getProductBySlug } from '@/lib/queries/products'
import { imageUrl } from '@/lib/images'

/**
 * 상품 상세. 주소는 `/products/<slug>` 다.
 *
 * **껍데기는 `(shop)/layout.tsx` 가 맡는다.** 여기에는 본문만 있다.
 *
 * 계승한 디자인을 그대로 따른다 (CLAUDE.md 1절).
 * - 왼쪽 사진 / 오른쪽 정보의 2단. 히어로와 같은 나눔이다
 * - 이름은 serif, 라벨은 10~11px 대문자, 사진은 3:4 세로
 * - 얇은 `gray-200` 실선이 구획을 나눈다
 *
 * **상품 정보는 Supabase 에서 읽는다.** 하드코딩하지 말 것. 감춘 상품
 * (`is_active = false`)은 RLS 가 막아 주소를 직접 쳐도 404 가 된다.
 */

/** 목록과 같은 주기로 다시 굽는다. 사유는 `(shop)/page.tsx` 참조 */
export const revalidate = 60

const CATEGORY_LABEL: Record<string, string> = {
  keyring: 'KEYRING',
  bracelet: 'BRACELET',
  necklace: 'NECKLACE',
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: '찾을 수 없는 상품 — 버터웨더' }

  return {
    title: `${product.name} — 버터웨더`,
    description: product.description ?? undefined,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  // 없는 slug 와 감춘 상품이 같은 화면으로 끝난다. 밖에서 둘을 구분할 수
  // 없어야 한다 — 구분되면 감춘 상품의 존재가 새어 나간다.
  if (!product) notFound()

  return (
    <>
      {/* ───── 어디에 있는지 ───── */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-7 py-4">
        <Link href="/" className="text-ink-subtle hover:text-ink text-caption">
          홈
        </Link>
        <span className="text-ink-subtle text-caption">/</span>
        <span className="text-ink-muted text-caption">
          {CATEGORY_LABEL[product.category]}
        </span>
      </div>

      {/* ───── 사진 / 정보 ───── */}
      <div className="grid grid-cols-1 border-b border-gray-200 lg:grid-cols-2">
        <div className="border-b border-gray-200 lg:border-r lg:border-b-0">
          <ProductGallery images={product.images} alt={product.name} />
        </div>

        <div className="flex flex-col justify-center p-10 lg:p-14">
          <Label className="mb-4">{CATEGORY_LABEL[product.category]}</Label>

          <h1 className="text-ink text-display mb-2 font-serif leading-snug">
            {product.name}
          </h1>
          {product.name_en ? (
            <p className="text-ink-subtle text-caption mb-6 tracking-wide uppercase">
              {product.name_en}
            </p>
          ) : (
            <div className="mb-6" />
          )}

          <VariantPicker variants={product.variants} />

          {product.description ? (
            <div className="mt-10 border-t border-gray-200 pt-8">
              <Label className="mb-3">About</Label>
              <p className="text-ink-muted text-body leading-relaxed font-light whitespace-pre-line">
                {product.description}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/*
        ───── 상세 이미지 ─────
        세로로 길게 쌓이는 설명 이미지다. `images` 와 섞지 않는다
        (types/product.ts). 아직 넣은 상품이 없어 대개 비어 있다.
      */}
      {product.detail_images.length > 0 ? (
        <div className="border-b border-gray-200">
          {product.detail_images.map((src) => (
            <div key={src} className="relative w-full">
              <Image
                src={imageUrl(src)}
                alt=""
                width={1200}
                height={1600}
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="mx-auto h-auto w-full max-w-3xl"
              />
            </div>
          ))}
        </div>
      ) : null}

      {/*
        배송·교환·보관 안내를 둘 자리가 여기다. **아직 두지 않는다** —
        발송 소요일이나 교환 조건은 지어낼 수 없는 값이고(CLAUDE.md 8절),
        실제 정책이 정해지면 그때 넣는다. 빈 칸을 미리 만들어 두지 않는다.
      */}
    </>
  )
}
