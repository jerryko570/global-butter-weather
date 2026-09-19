import Image from 'next/image'
import Link from 'next/link'
import Label from '@/components/Label'
import Plane from '@/components/Plane'
import { getProducts, formatKRW } from '@/lib/queries/products'
import { imageUrl } from '@/lib/images'
import type { ProductListItem } from '@/types/product'

/**
 * 첫 화면. **옛 버터웨더 사이트의 디자인을 그대로 계승한다.**
 * 원본은 `jerryko570/butter-weather-shop`의 `(shop)/layout.tsx`·`(shop)/page.tsx`·
 * `components/layout/{Sidebar,Footer}.tsx`다.
 *
 * ⚠️ CLAUDE.md 1절에 「코드는 butter-weather-shop에서 가져오지 않았다」고
 * 적혀 있는데, **2026-09-15에 이 방침이 바뀌었다.** 디자인은 계승한다.
 *
 * 계승한 조형 — 이것들이 이 디자인의 성격이다. 지우지 말 것.
 * - **얇은 격자선이 화면을 나눈다.** 구획마다, 상품 칸마다 `gray-200` 실선이
 *   있다. 인쇄된 카탈로그처럼 읽힌다. 선을 걷어내면 이 디자인이 아니다
 * - **제목은 serif.** 본문·라벨은 sans. 브랜드의 목소리만 serif다
 * - **라벨은 10~11px 대문자에 자간을 넓게.** 아주 작고 조용하다
 * - **상품 사진은 3:4 세로.** 정사각이 아니다
 * - **버튼은 모서리가 없는 사각형.** 검정 면 / 테두리만
 * - 태그라인은 **serif italic**
 *
 * 우리가 더한 것 — 둘 다 이나래 확인을 받았다.
 * - 카테고리 앞의 모티프 (「과하지 않다」)
 * - 상품 격자에 드물게 끼는 일러스트 면 (8칸에 1개)
 *
 * 뺀 것 — 상단 티커 띠(무료배송 기준·입고 주기). 이나래가 빼라고 했다.
 *
 * **사이드바·상단 줄·footer는 여기 없다.** `(shop)/layout.tsx` 가 맡는다 —
 * 상세 화면과 같은 껍데기를 쓰기 때문이다.
 *
 * 상품은 **Supabase 에서 읽는다** (`products_public` 뷰). 하드코딩하지 말 것.
 * 화면에 안 보이면 데이터가 없거나 `is_active` 가 꺼져 있는 것이다.
 */

/**
 * 상품이 바뀌면 화면도 바뀌어야 한다. 빌드 때 한 번 굽고 마는 것이
 * 기본이라 그대로 두면 **새 상품을 넣어도 재배포 전까지 안 보인다.**
 * 60초마다 다시 굽는다 — 손으로 고치는 작은 가게에 이 정도면 충분하고,
 * 매 요청마다 DB를 때리지 않는다.
 */
export const revalidate = 60

/** DB 값 → 화면 라벨. 칸 안의 대문자 라벨에 쓴다. */
const CATEGORY_LABEL: Record<string, string> = {
  keyring: 'KEYRING',
  bracelet: 'BRACELET',
  necklace: 'NECKLACE',
}

/**
 * 상품 칸. **사진 → 카테고리 → 이름 → 가격** 순서를 지킨다 (5-15절).
 * 가격은 「얼마부터」다 — 옵션마다 값이 달라 최저가를 보여준다.
 */
function ProductCell({ product }: { product: ProductListItem }) {
  // DB 에는 저장소 안의 경로만 들어 있다. 주소를 만드는 규칙은 한 군데에
  // 둔다 — 화면마다 조합하면 프로젝트가 바뀔 때 전부 고쳐야 한다.
  const image = imageUrl(product.images[0] ?? '')
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group border-r border-b border-gray-200 [&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(4n)]:border-r-0"
    >
      <div className="relative aspect-3/4 overflow-hidden bg-gray-100">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="border-t border-gray-200 p-4">
        <Label className="mb-1">{CATEGORY_LABEL[product.category]}</Label>
        <p className="text-ink text-body mb-2 group-hover:underline">
          {product.name}
        </p>
        <p className="text-ink text-body font-medium">
          {formatKRW(product.min_price_krw)}
          {product.variant_count > 1 ? (
            <span className="text-ink-subtle"> 부터</span>
          ) : null}
        </p>
      </div>
    </Link>
  )
}

export default async function Home() {
  const products = await getProducts()
  // 격자에 일러스트 면이 한 칸 들어가므로 상품은 7개까지만 (8칸에 1개)
  const preview = products.slice(0, 7)

  return (
    <>
      {/* ───── 히어로 ───── */}
      <section className="grid grid-cols-1 border-b border-gray-200 lg:grid-cols-2">
        <div className="relative min-h-[400px] border-b border-gray-200 lg:min-h-[520px] lg:border-r lg:border-b-0">
          <Plane src="pattern-red-berry" zoom={220} />
          <span className="text-ink-muted text-label absolute top-6 left-6 z-10 bg-white px-2 py-1 uppercase">
            SS 2026
          </span>
        </div>

        <div className="flex flex-col justify-between p-12 lg:p-14">
          <div>
            <Label className="mb-5">신규 컬렉션 — 2026 봄/여름</Label>
            <h1 className="text-ink text-display mb-5 font-serif">
              나의 하루에 부드럽게
              <br />
              스며드는 작은 온기
            </h1>
            <p className="text-ink-muted text-body max-w-xs leading-relaxed font-light">
              키링 하나, 비즈 하나가 담아내는 감정.
              <br />
              작은 오브제로 하루를 디자인합니다.
            </p>
            <div className="mt-10 flex gap-3">
              <a
                href="#"
                className="bg-ink text-cloud text-caption px-7 py-3 tracking-widest uppercase"
              >
                쇼핑하기
              </a>
              <a
                href="#"
                className="text-ink hover:border-ink text-caption border border-gray-300 px-7 py-3 tracking-widest uppercase"
              >
                신상품
              </a>
            </div>
          </div>

          <dl className="mt-10 flex gap-8 border-t border-gray-200 pt-8">
            {[
              [String(products.length), '상품'],
              ['KR · EN', '언어'],
              ['WW', '배송'],
            ].map(([val, label]) => (
              <div key={label}>
                <dt className="text-ink text-title font-serif">{val}</dt>
                <dd className="text-ink-subtle text-caption mt-1">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ───── 신상품 ───── */}
      <div className="flex items-center justify-between border-b border-gray-200 px-7 py-5">
        <h2 className="text-ink text-title font-serif">신상품</h2>
        <a
          href="#"
          className="text-ink-muted hover:text-ink text-caption tracking-widest uppercase"
        >
          전체 보기
        </a>
      </div>

      {preview.length === 0 ? (
        <div className="border-b border-gray-200 px-7 py-20 text-center">
          <p className="text-ink-muted text-body">
            아직 등록된 상품이 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 border-b border-gray-200 lg:grid-cols-4">
          {preview.map((product) => (
            <ProductCell key={product.id} product={product} />
          ))}

          {/* 8칸에 하나 끼는 일러스트 면. 팔지 않는 칸이다 */}
          <div className="border-b border-gray-200 lg:[&:nth-child(4n)]:border-r-0">
            <div className="aspect-3/4">
              <Plane src="pattern-clover" zoom={190} />
            </div>
            <div className="border-t border-gray-200 p-4">
              <Label className="mb-1">Lookbook</Label>
              <p className="text-ink-muted text-body">2026 봄/여름 그래픽</p>
            </div>
          </div>
        </div>
      )}

      {/* ───── 브랜드 스토리 ───── */}
      <div className="grid grid-cols-1 border-b border-gray-200 lg:grid-cols-2">
        <div className="relative min-h-[260px] border-b border-gray-200 lg:border-r lg:border-b-0">
          <Image
            src="/photos/keyring-on-orange-pattern.jpg"
            alt="주황 패턴 바닥 위의 비즈 키링"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center p-12">
          <Label className="mb-4">Our Story</Label>
          <h3 className="text-ink text-title mb-4 font-serif leading-snug">
            작은 오브제,
            <br />
            정직한 디자인.
          </h3>
          <p className="text-ink-muted text-caption mb-6 leading-relaxed font-light">
            하나하나 손으로 만듭니다.
            <br />
            매주 새로운 것이 들어옵니다.
          </p>
          <a
            href="#"
            className="text-ink border-ink hover:text-ink-muted text-caption inline-block w-fit border-b pb-0.5 tracking-widest uppercase"
          >
            더 보기
          </a>
        </div>
      </div>
    </>
  )
}
