import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '첫 화면 시안 — 버터웨더',
}

/**
 * M1 첫 화면 레이아웃 시안. **고르고 나면 이 route는 지운다.**
 *
 * 여기서 비교하는 것은 **구조뿐이다** — 어디에 얼마나 큰 자리를 두는가.
 * 그 자리에 무엇이 들어갈지(사진인가 색면인가, 무엇의 사진인가)는
 * 색·유니크함의 판단이라 이나래가 정한다 (foundation.md 5-9절
 * 「규칙이 되는 것과 되지 않는 것」).
 *
 * 지킨 것:
 * - karactor·colorcolour 방향 — 물건을 팔지 않고, 텍스트가 거의 없다
 * - 한 화면 안 요소의 종류와 크기 통일
 * - 그라데이션·blur 없음, 면은 선명한 경계로
 * - butter 포인트는 각 시안에 **하나만**
 */

/** 아직 정해지지 않은 자리. 사진일 수도 색면일 수도 있다. */
function Slot({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center border border-dashed border-gray-300 bg-gray-100">
      <span className="text-ink-subtle text-caption px-4 text-center">
        {label}
      </span>
    </div>
  )
}

function DraftLabel({
  id,
  title,
  note,
}: {
  id: string
  title: string
  note: string
}) {
  return (
    <div className="mx-auto w-full max-w-(--container-max) border-t border-gray-200 px-6 pt-6 pb-4">
      <p className="text-ink text-body font-medium">
        {id}. {title}
      </p>
      <p className="text-ink-muted text-caption mt-1">{note}</p>
    </div>
  )
}

export default function M1Draft() {
  return (
    <div className="pb-24">
      <div className="mx-auto w-full max-w-(--container-max) px-6 py-10">
        <h1 className="text-ink text-display font-medium tracking-tight">
          첫 화면 시안
        </h1>
        <p className="text-ink-muted text-body mt-3 max-w-prose">
          구조만 비교합니다. 점선 자리에 무엇이 들어갈지는 아직 정하지
          않았습니다 — 사진일 수도, 색면일 수도 있습니다.
        </p>
        <span className="bg-butter mt-6 block h-1 w-8" aria-hidden />
      </div>

      {/* A — 여백형 */}
      <DraftLabel
        id="A"
        title="여백형"
        note="화면 대부분이 한 자리. 텍스트는 아래 구석에 작게. karactor의 커튼 화면에 가장 가깝습니다."
      />
      <section className="mx-auto w-full max-w-(--container-max) px-6">
        <div className="h-[70vh]">
          <Slot label="화면 대부분을 차지하는 자리" />
        </div>
        <div className="flex items-end justify-between py-6">
          <div>
            <p className="text-ink text-title font-medium tracking-tight">
              버터웨더
            </p>
            <p className="text-ink-muted text-caption mt-1">
              나의 하루에 부드럽게 스며드는 작은 온기
            </p>
          </div>
          <span className="bg-butter mb-1 block h-1 w-8" aria-hidden />
        </div>
      </section>

      {/* B — 분할형 */}
      <DraftLabel
        id="B"
        title="분할형"
        note="좌우로 나눠 한쪽은 자리, 한쪽은 여백과 문구. karactor 홈이 이 구조입니다."
      />
      <section className="mx-auto w-full max-w-(--container-max) px-6">
        <div className="flex h-[70vh] flex-col gap-6 md:flex-row">
          <div className="flex flex-1 flex-col justify-end pb-2">
            <p className="text-ink text-display font-medium tracking-tight">
              버터웨더
            </p>
            <p className="text-ink-muted text-body mt-3">
              나의 하루에 부드럽게 스며드는 작은 온기
            </p>
            <span className="bg-butter mt-8 block h-1 w-8" aria-hidden />
          </div>
          <div className="flex-1">
            <Slot label="화면 절반" />
          </div>
        </div>
      </section>

      {/* C — 중앙형 */}
      <DraftLabel
        id="C"
        title="중앙형"
        note="자리를 가운데 하나 두고 위아래를 크게 비웁니다. colorcolour의 인물 클로즈업 쪽입니다."
      />
      <section className="mx-auto w-full max-w-(--container-max) px-6">
        <div className="flex h-[80vh] flex-col items-center justify-center">
          <div className="h-[55vh] w-full max-w-md">
            <Slot label="가운데 하나" />
          </div>
          <p className="text-ink text-title mt-8 font-medium tracking-tight">
            버터웨더
          </p>
          <p className="text-ink-muted text-caption mt-2">
            나의 하루에 부드럽게 스며드는 작은 온기
          </p>
          <span className="bg-butter mt-6 block h-1 w-8" aria-hidden />
        </div>
      </section>
    </div>
  )
}
