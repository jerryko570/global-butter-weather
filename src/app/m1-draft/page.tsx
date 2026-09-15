import Image from 'next/image'
import type { Metadata } from 'next'
import Button from '@/components/Button'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: '첫 화면 목업 — 버터웨더',
}

/**
 * M1 첫 화면 목업. **구조는 정해졌다** — 시안 H다.
 * 확정되면 이 내용이 `/`로 가고 이 route는 지운다.
 *
 * 앞선 시안 A~G는 폐기됐다. 이유는 foundation.md 5-15절에 있다 —
 * 전부 상품을 보여주지 않았고, 뎁스를 만들었다.
 *
 * **레이아웃은 평범하다. 그래도 된다** (5-14절). 옛 버터웨더 사이트의
 * 뼈대를 그대로 쓴다 — 왼쪽 고정 카테고리, 키비주얼, 상품 그리드,
 * 사진 아래 카테고리·이름·가격. 한국에서 쇼핑하던 사람에게 익숙한 순서다.
 *
 * 감각은 레이아웃이 아니라 아래 세 자리에 싣는다.
 * 1. **카테고리 앞의 모티프** — 이나래가 그린 것이 그대로 글머리가 된다
 * 2. **키비주얼이 일러스트 면** — 아이덴티티 층은 쨍해도 된다 (5-13절)
 * 3. **그리드에 드물게 끼는 일러스트 면** — 룩북이 샵 안에 있으므로
 *    뎁스가 생기지 않는다. 8칸에 1개로 둔다
 *
 * 상단 알림 띠(무료배송 기준·입고 주기)는 두지 않는다.
 *
 * ⚠️ 상품 이름·가격·지표는 전부 **임시값**이다. M2에서 실제 데이터로 바꾼다.
 */

/** 상품 칸. 사진 → 카테고리 → 이름 → 가격 순서를 지킨다. */
function ProductCell({
  src,
  name,
  price,
}: {
  src: string
  name: string
  price: string
}) {
  return (
    <a href="#" className="group block">
      <div className="relative aspect-square bg-white">
        <Image
          src={`/photos/${src}.jpg`}
          alt={name}
          fill
          sizes="(max-width: 768px) 50vw, 22vw"
          className="object-cover"
        />
      </div>
      {/* 칸이 서로 맞닿으므로 글자에만 안쪽 여백을 준다 */}
      <div className="px-3 pt-3 pb-8">
        <p className="text-ink text-body group-hover:underline">{name}</p>
        <p className="text-ink-muted text-body mt-0.5">{price}</p>
      </div>
    </a>
  )
}

/** 일러스트 면. 통째로 놓고 확대해 잘라낸다 (5-11절). */
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

/** 사이드바 카테고리 한 줄. 모티프가 글머리 자리에 온다. */
function CategoryRow({
  motif,
  label,
  active,
}: {
  motif: string
  label: string
  active?: boolean
}) {
  return (
    <a href="#" className="group flex items-center gap-3 py-1.5">
      <span
        className="h-9 w-8 shrink-0 bg-cover bg-center"
        style={{ backgroundImage: `url(/illustrations/${motif}.svg)` }}
        aria-hidden
      />
      <span
        className={
          active
            ? 'text-ink text-body font-medium'
            : 'text-ink-muted group-hover:text-ink text-body'
        }
      >
        {label}
      </span>
    </a>
  )
}

function QuietLink({ children }: { children: React.ReactNode }) {
  return (
    <a
      href="#"
      className="text-ink-muted hover:text-ink text-caption block py-1"
    >
      {children}
    </a>
  )
}

export default function M1Draft() {
  return (
    <div className="bg-cloud min-h-dvh">
      <div className="mx-auto flex w-full max-w-[1440px]">
        {/* ───── 왼쪽 고정 ───── */}
        <aside className="sticky top-0 hidden h-dvh w-[220px] shrink-0 flex-col px-5 py-8 md:flex">
          <a
            href="#"
            className="text-ink text-body font-medium tracking-[0.12em]"
          >
            BUTTER WEATHER
          </a>

          <p className="text-ink-subtle text-caption mt-8 tracking-[0.15em]">
            SHOP
          </p>
          <nav className="mt-1">
            <CategoryRow motif="motif-sun" label="전체" active />
            <CategoryRow motif="motif-tulip" label="키링" />
            <CategoryRow motif="motif-blue-flower" label="비즈" />
            <CategoryRow motif="motif-watering-can" label="기타" />
          </nav>

          <div className="mt-8">
            <QuietLink>소개</QuietLink>
            <QuietLink>문의</QuietLink>
          </div>

          <p className="text-ink-muted text-caption mt-8">
            <span className="text-ink-subtle tracking-[0.15em]">LANGUAGE</span>
            <br />
            <span className="text-ink mt-1 inline-block font-medium">KR</span>
            <span className="text-ink-subtle"> · EN</span>
          </p>

          {/* 아래로 밀어붙인다 */}
          <div className="mt-auto">
            <QuietLink>Instagram</QuietLink>
            <QuietLink>Contact</QuietLink>
            <div className="mt-4">
              <ThemeToggle />
            </div>
          </div>
        </aside>

        {/* ───── 오른쪽 ───── */}
        <main className="min-w-0 flex-1">
          {/* 상단 — 알림 워딩은 두지 않는다. 계정 동작만 오른쪽에 */}
          <div className="flex items-center justify-end gap-5 px-6 py-4">
            <a href="#" className="text-ink-muted hover:text-ink text-caption">
              로그인
            </a>
            <a href="#" className="text-ink-muted hover:text-ink text-caption">
              회원가입
            </a>
            <a href="#" className="text-ink text-caption font-medium">
              장바구니 (0)
            </a>
          </div>

          {/* ───── 키비주얼 · 아이덴티티 ───── */}
          <section className="flex flex-col lg:flex-row">
            <div className="h-[42svh] lg:h-[56svh] lg:w-[52%]">
              <Plane src="pattern-red-berry" zoom={220} />
            </div>
            <div className="flex flex-1 flex-col justify-center px-8 py-12 lg:px-12">
              <p className="text-ink-subtle text-caption tracking-[0.15em]">
                신규 컬렉션 — 2026 봄/여름
              </p>
              <h1 className="text-ink text-display mt-4 font-medium tracking-tight">
                나의 하루에 부드럽게
                <br />
                스며드는 작은 온기
              </h1>
              <p className="text-ink-muted text-body mt-4 max-w-prose">
                키링 하나, 비즈 하나가 담아내는 감정.
                <br />
                작은 오브제로 하루를 디자인합니다.
              </p>
              <div className="mt-8 flex gap-3">
                <Button>쇼핑하기</Button>
                <Button variant="secondary">신상품</Button>
              </div>

              <dl className="mt-12 flex gap-10">
                <div>
                  <dt className="text-ink text-title font-medium">16</dt>
                  <dd className="text-ink-muted text-caption mt-1">상품</dd>
                </div>
                <div>
                  <dt className="text-ink text-title font-medium">KR · EN</dt>
                  <dd className="text-ink-muted text-caption mt-1">언어</dd>
                </div>
                <div>
                  <dt className="text-ink text-title font-medium">WW</dt>
                  <dd className="text-ink-muted text-caption mt-1">배송</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* ───── 신상품 ───── */}
          <section className="pt-20 pb-10">
            <div className="flex items-baseline justify-between px-6">
              <h2 className="text-ink text-display font-medium tracking-tight">
                신상품
              </h2>
              <a
                href="#"
                className="text-ink-muted hover:text-ink text-caption"
              >
                전체 보기
              </a>
            </div>

            {/* 여백 0 — 칸이 서로 맞닿는다. 격자 자체가 한 덩어리가 되고
                시선이 선이 아니라 사진과 그래픽으로 간다 */}
            <div className="mt-8 grid grid-cols-2 gap-0 md:grid-cols-4">
              <ProductCell
                src="keyring-on-paper"
                name="꽃 비즈 키링"
                price="₩21,000"
              />
              <ProductCell
                src="keyring-with-jar"
                name="라인 비즈 키링"
                price="₩19,000"
              />
              <ProductCell
                src="keyring-on-phone"
                name="폰 스트랩"
                price="₩23,000"
              />
              <ProductCell
                src="keyring-on-orange-pattern"
                name="더블 플라워 키링"
                price="₩24,000"
              />
              <ProductCell
                src="keyring-on-wood"
                name="미니 참"
                price="₩12,000"
              />
              <ProductCell
                src="keyring-on-paper"
                name="시드 비즈 세트"
                price="₩15,000"
              />
              <ProductCell
                src="keyring-with-jar"
                name="투톤 비즈 키링"
                price="₩20,000"
              />
              {/* 룩북이 샵 안으로 — 8칸에 1개로 드물게 */}
              <div className="aspect-square">
                <Plane src="pattern-clover" zoom={190} />
              </div>
            </div>
          </section>

          {/* ───── footer ───── */}
          <footer className="px-6 pt-20 pb-12">
            <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
              <div>
                <p className="text-ink text-body font-medium tracking-[0.12em]">
                  BUTTER WEATHER
                </p>
                <p className="text-ink-muted text-caption mt-3 leading-relaxed">
                  작은 오브제, 정직한 디자인.
                  <br />
                  Designed in Seoul
                </p>
              </div>

              <div className="flex gap-12">
                <div>
                  <p className="text-ink-subtle text-caption tracking-[0.15em]">
                    SHOP
                  </p>
                  <div className="mt-2">
                    <QuietLink>전체</QuietLink>
                    <QuietLink>키링</QuietLink>
                    <QuietLink>비즈</QuietLink>
                    <QuietLink>기타</QuietLink>
                  </div>
                </div>
                <div>
                  <p className="text-ink-subtle text-caption tracking-[0.15em]">
                    ABOUT
                  </p>
                  <div className="mt-2">
                    <QuietLink>소개</QuietLink>
                    <QuietLink>배송·교환·반품</QuietLink>
                    <QuietLink>문의</QuietLink>
                  </div>
                </div>
                <div>
                  <p className="text-ink-subtle text-caption tracking-[0.15em]">
                    FOLLOW
                  </p>
                  <div className="mt-2">
                    <QuietLink>Instagram</QuietLink>
                    <QuietLink>네이버 스마트스토어</QuietLink>
                    <QuietLink>Contact</QuietLink>
                  </div>
                </div>
              </div>
            </div>

            {/* 한국 쇼핑몰에 반드시 있는 자리. 내용은 아직 없다 */}
            <p className="text-ink-subtle text-caption mt-12 leading-relaxed">
              상호 · 대표 · 사업자등록번호 · 통신판매업신고번호 · 주소 ·
              개인정보관리책임자 — 아직 채우지 않았습니다
              <br />© 2026 BUTTER WEATHER
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
