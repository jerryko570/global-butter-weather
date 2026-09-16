import Image from 'next/image'
import ThemeToggle from '@/components/ThemeToggle'
import { getProducts, formatKRW } from '@/lib/queries/products'
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
 * ⚠️ 글자 크기가 우리 token scale(24/18/14/12px)을 벗어난다. 이 디자인은
 * 10·11·13·15·20·22·38px을 쓴다. 지금은 원본에 맞춰 직접 적었다 —
 * scale을 이 디자인에서 다시 뽑는 것은 Design/System 작업으로 따로 한다.
 *
 * 상품은 **Supabase 에서 읽는다** (`products_public` 뷰). 하드코딩하지 말 것.
 * 화면에 안 보이면 데이터가 없거나 `is_active` 가 꺼져 있는 것이다.
 *
 * 디자인은 언제든 바뀔 수 있다. 여기서 더 붙들지 않고 M2로 넘어간다.
 */

/**
 * 2026-09-16에 확정됐다. **소재가 아니라 형태로 나눈다** — 「비즈」는
 * 재료 이름이었고 「팔찌·목걸이」는 몸의 어디에 걸리는지다.
 * 「기타」는 없앴다. 지금 만드는 것 셋이 전부다.
 *
 * 모티프 배정은 형태를 따라갔다 — 팔찌는 호를 그리는 무지개, 목걸이는
 * 줄기가 아래로 늘어지는 꽃. 바꿔도 되는 부분이다.
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

const CATEGORIES = [
  { motif: 'motif-sun', label: '전체', active: true },
  { motif: 'motif-tulip', label: '키링' },
  { motif: 'motif-rainbow', label: '팔찌' },
  { motif: 'motif-blue-flower', label: '목걸이' },
]

const FOOTER_COLS = [
  { title: 'SHOP', links: ['신상품', '키링', '팔찌', '목걸이'] },
  { title: 'ORDER', links: ['배송 안내', '교환·반품', '자주 묻는 질문'] },
  {
    title: 'BRAND',
    links: ['소개', 'Instagram', '네이버 스마트스토어', 'Contact'],
  },
]

/** 일러스트 면. 통째로 놓고 확대해 잘라낸다 (foundation.md 5-11절). */
function Plane({ src, zoom }: { src: string; zoom: number }) {
  return (
    <div
      className="h-full w-full"
      style={{
        backgroundImage: `url(/illustrations/${src}.svg)`,
        backgroundSize: `${zoom}% auto`,
        backgroundPosition: 'center',
      }}
      aria-hidden
    />
  )
}

/**
 * 상품 칸. **사진 → 카테고리 → 이름 → 가격** 순서를 지킨다 (5-15절).
 * 가격은 「얼마부터」다 — 옵션마다 값이 달라 최저가를 보여준다.
 */
function ProductCell({ product }: { product: ProductListItem }) {
  const image = product.images[0]
  return (
    <a
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
    </a>
  )
}

/** 10~11px 대문자 라벨. 이 디자인에서 가장 자주 쓰이는 조각이다. */
function Label({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p className={`text-ink-subtle text-label uppercase ${className}`}>
      {children}
    </p>
  )
}

export default async function Home() {
  const products = await getProducts()
  // 격자에 일러스트 면이 한 칸 들어가므로 상품은 7개까지만 (8칸에 1개)
  const preview = products.slice(0, 7)

  return (
    <div className="lg:flex lg:min-h-dvh">
      {/* ═══ 왼쪽 사이드바 — 구획마다 실선으로 나뉜다 ═══ */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-gray-200 lg:flex">
        <div className="border-b border-gray-200 px-6 py-5">
          <a href="#" className="text-ink text-wordmark font-serif uppercase">
            Butter Weather
          </a>
        </div>

        <div className="border-b border-gray-200 px-6 py-6">
          <Label className="mb-3">Shop</Label>
          <nav className="flex flex-col gap-1">
            {CATEGORIES.map((c) => (
              <a
                key={c.label}
                href="#"
                className="group flex items-center gap-3"
              >
                <span
                  className="h-9 w-8 shrink-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(/illustrations/${c.motif}.svg)`,
                  }}
                  aria-hidden
                />
                <span
                  className={
                    c.active
                      ? 'text-ink text-body'
                      : 'text-ink-muted group-hover:text-ink text-body'
                  }
                >
                  {c.label}
                </span>
              </a>
            ))}
          </nav>

          <div className="mt-6 flex items-center gap-2">
            <Label>Language</Label>
            <span className="text-ink text-caption">KR</span>
            <span className="text-ink-subtle text-caption">·</span>
            <span className="text-ink-subtle hover:text-ink text-caption">
              EN
            </span>
          </div>
        </div>

        {/* 태그라인 — serif italic. 이 디자인의 목소리다 */}
        <div className="border-b border-gray-200 px-6 py-6">
          <p className="text-ink-muted text-body font-serif leading-relaxed italic">
            작은 오브제,
            <br />
            정직한 디자인.
          </p>
        </div>

        <div className="px-6 py-6">
          <a href="#" className="text-ink-muted hover:text-ink text-body">
            소개
          </a>
        </div>

        <div className="mt-auto border-t border-gray-200 px-6 py-5">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <a href="#" className="text-ink-subtle hover:text-ink text-caption">
              Instagram
            </a>
            <a href="#" className="text-ink-subtle hover:text-ink text-caption">
              Contact
            </a>
          </div>
          <div className="mt-4">
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* ═══ 오른쪽 ═══ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 계정·장바구니. 티커 띠는 두지 않는다 */}
        <div className="flex items-center justify-end gap-5 border-b border-gray-200 px-6 py-3">
          <a href="#" className="text-ink-muted hover:text-ink text-caption">
            로그인
          </a>
          <a href="#" className="text-ink-muted hover:text-ink text-caption">
            회원가입
          </a>
          <a
            href="#"
            className="text-ink-muted hover:text-ink text-caption tracking-wide uppercase"
          >
            Cart (0)
          </a>
        </div>

        <main className="flex-1">
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
                    <dd className="text-ink-subtle text-caption mt-1">
                      {label}
                    </dd>
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
              className="text-ink-subtle hover:border-ink hover:text-ink text-caption border-b border-gray-300 pb-0.5 tracking-widest uppercase"
            >
              전체 보기
            </a>
          </div>

          {preview.length === 0 ? (
            /* 상품이 하나도 없을 때. 격자를 빈 채로 두면 화면이 무너져
               보이므로 한 줄로 대신한다. 데이터가 없는 것과 못 읽은 것은
               다른 일이라, 못 읽었을 때는 서버 로그에 남는다. */
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

              {/* 룩북이 샵 안으로 — 8칸에 1개. 상품과 같은 칸 크기를 쓴다.
                  따로 페이지를 두면 뎁스가 되고, 칸으로 끼우면 같은 화면이다
                  (foundation.md 5-15절). */}
              <div className="border-b border-gray-200 lg:[&:nth-child(4n)]:border-r-0">
                <div className="aspect-3/4">
                  <Plane src="pattern-clover" zoom={190} />
                </div>
                <div className="border-t border-gray-200 p-4">
                  <Label className="mb-1">Lookbook</Label>
                  <p className="text-ink-muted text-body">
                    2026 봄/여름 그래픽
                  </p>
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
        </main>

        {/* ───── footer ───── */}
        <footer>
          <div className="grid grid-cols-1 border-t border-gray-200 sm:grid-cols-3">
            {FOOTER_COLS.map((col) => (
              <div
                key={col.title}
                className="border-b border-gray-200 p-7 sm:border-r sm:border-b-0 sm:last:border-r-0"
              >
                <Label className="mb-4">{col.title}</Label>
                <ul className="flex flex-col gap-2">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-ink-muted hover:text-ink text-body"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 px-7 py-4">
            <p className="text-ink-subtle text-caption">
              © 2026 Butter Weather — 사업자 정보는 아직 채우지 않았습니다
            </p>
            <div className="flex items-center gap-4">
              <span className="text-ink text-caption">KR</span>
              <span className="text-ink-subtle hover:text-ink text-caption">
                EN
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
