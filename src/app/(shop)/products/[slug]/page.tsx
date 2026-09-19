import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Label from '@/components/Label'
import ProductGallery from '@/components/ProductGallery'
import ProductTabs from '@/components/ProductTabs'
import VariantPicker from '@/components/VariantPicker'
import { getProductBySlug } from '@/lib/queries/products'

/**
 * 상품 상세. 주소는 `/products/<slug>` 다.
 *
 * **구조를 옛 레포에서 그대로 계승한다** — `butter-weather-shop` 의
 * `(shop)/products/[slug]/page.tsx`. 2026-09-19에 원본을 다시 읽고 맞췄다.
 *
 * - 상단 2단 — 좌: 갤러리 / 우: 정보블록
 * - 정보블록 순서 — 카테고리 → 이름 → 보조 이름 → 가격 → 설명 →
 *   구분선 → 옵션 → 수량 → 합계 → 버튼
 * - 하단 탭 — `Detail` · `Shipping & Returns`
 *
 * **메인 사진은 정사각이다.** 목록 칸(3:4)과 다르다 — 원본이 그렇게
 * 나눠 두었다. ProductGallery 주석 참조.
 *
 * 옛 쪽과 달라진 것은 **옵션(variant)** 하나다. 옛 쪽은 가격·재고가 상품에
 * 붙어 있어 수량만 있으면 됐다 (schema.md 1절).
 *
 * **껍데기는 `(shop)/layout.tsx` 가 맡는다.** 여기에는 본문만 있다.
 * **상품 정보는 Supabase 에서 읽는다.** 하드코딩하지 말 것.
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
    <div>
      {/* ── 상단 2단: 좌 갤러리 / 우 정보블록 ── */}
      <div className="grid grid-cols-1 border-b border-gray-200 lg:grid-cols-2">
        <div className="border-b border-gray-200 lg:border-r lg:border-b-0">
          <ProductGallery images={product.images} alt={product.name} />
        </div>

        <div className="flex flex-col justify-center p-8 lg:p-12">
          <div className="flex flex-col gap-6">
            <div>
              <Label className="mb-2 block">
                {CATEGORY_LABEL[product.category]}
              </Label>
              <h1 className="text-ink text-display font-serif leading-tight">
                {product.name}
              </h1>
              {product.name_en ? (
                <p className="text-ink-subtle text-caption mt-1">
                  {product.name_en}
                </p>
              ) : null}
            </div>

            {product.description ? (
              <p className="text-ink-muted text-body leading-relaxed font-light whitespace-pre-line">
                {product.description}
              </p>
            ) : null}

            <VariantPicker variants={product.variants} />
          </div>
        </div>
      </div>

      {/* ── 하단 탭: Detail / Shipping & Returns ── */}
      <ProductTabs
        detailImages={product.detail_images}
        description={product.description}
        alt={product.name}
      />
    </div>
  )
}
