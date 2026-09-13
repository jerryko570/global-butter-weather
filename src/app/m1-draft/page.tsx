import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '첫 화면 배치 시안 — 버터웨더',
}

/**
 * M1 첫 화면 **배치** 시안. 고르고 나면 이 route는 지운다.
 *
 * 1차(좌우 50:50 분할)는 폐기됐다. karactor를 직독직해한 것이었기 때문이다.
 * 실제로 열어보니 karactor의 특징은 반으로 가르는 것이 아니라
 * **UI가 면을 갖지 않고 「틈」에 산다**는 것이었다 (foundation.md 5-6절).
 *
 * 세 시안이 공유하는 것 — 이것들은 고르는 대상이 아니라 전제다.
 * - **한 화면은 한 장면이다.** 정보를 쌓아 내려가지 않는다
 * - **UI는 자기 면을 요구하지 않는다.** 글자는 틈이나 구석에만 있다
 * - **화면은 쨍하고 상품은 차분하다** (5-13절). 면은 일러스트, 그 위/옆의
 *   사진 자리는 조용하다. 둘의 대비가 구조다
 * - **기울이지 않는다.** 기울임은 sunlovetour의 어휘이고 이나래의 그림에는
 *   기울어진 것이 하나도 없다
 * - **경계는 선명하다.** 그라데이션·blur로 두 면을 잇지 않는다 (5-9절)
 *
 * 시안에 쓴 일러스트는 **자리를 보이기 위한 것이지 선택이 아니다.**
 * 어느 그림이 첫 화면에 오는지는 이나래가 정한다 (5-9절).
 */

/** 아직 찍지 않은 상품 사진 자리. 5-11절 — 비율을 굳히지 않는다. */
function PhotoSlot({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center border border-dashed border-gray-400 bg-white">
      <span className="text-ink-muted text-caption px-3 text-center">
        {label}
      </span>
    </div>
  )
}

/** 일러스트 면. 통째로 놓고 확대해 잘라낸다 (5-11절·5-10절 규칙 4). */
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
    <div className="mx-auto w-full max-w-(--container-max) px-6 pt-16 pb-5">
      <p className="text-ink text-body font-medium">
        {id}. {title}
      </p>
      <p className="text-ink-muted text-caption mt-1 max-w-prose">{note}</p>
    </div>
  )
}

export default function M1Draft() {
  return (
    <div className="pb-24">
      <div className="mx-auto w-full max-w-(--container-max) px-6 py-10">
        <h1 className="text-ink text-display font-medium tracking-tight">
          첫 화면 배치 시안
        </h1>
        <p className="text-ink-muted text-body mt-3 max-w-prose">
          반으로 가르지 않습니다. 점선은 아직 찍지 않은 상품 사진 자리이고, 컬러
          면에 쓴 일러스트는 자리를 보이기 위한 것이지 고른 것이 아닙니다.
        </p>
      </div>

      {/* ───────── A. 틈 ───────── */}
      <DraftLabel
        id="A"
        title="틈"
        note="화면 대부분이 일러스트 면이고, 그 사이를 좁은 흰 띠가 지나갑니다. 글자는 그 띠 안에만 세로로 섭니다 — karactor에서 가져올 원리가 「분할」이 아니라 「UI가 틈에 산다」였습니다. 띠는 가운데가 아니라 오른쪽으로 밀려 있습니다."
      />
      <section className="mx-auto w-full max-w-(--container-max) px-6">
        <div className="flex h-[78svh]">
          <div className="flex-1">
            <Plane src="pattern-red-berry" zoom={260} />
          </div>

          {/* 틈 — UI가 사는 유일한 자리. 면을 갖지 않는다 */}
          <div className="flex w-16 shrink-0 flex-col items-center justify-between bg-white py-8">
            <span className="text-ink text-caption tracking-[0.3em] [writing-mode:vertical-rl]">
              SHOP
            </span>
            <span className="text-ink text-caption font-medium tracking-[0.3em] [writing-mode:vertical-rl]">
              버터웨더
            </span>
            <span className="text-ink text-caption tracking-[0.3em] [writing-mode:vertical-rl]">
              LOOKBOOK
            </span>
          </div>

          <div className="bg-cloud w-[28%] shrink-0 p-6">
            <PhotoSlot label="상품 사진 하나" />
          </div>
        </div>
      </section>

      {/* ───────── B. 걸친 사진 ───────── */}
      <DraftLabel
        id="B"
        title="걸친 사진"
        note="면과 여백이 6:4로 나뉘고, 상품 사진 한 장이 그 경계를 물고 걸칩니다. 경계가 한가운데가 아니고, 사진이 두 층(쨍한 아이덴티티 · 차분한 상품)을 실제로 붙여 놓습니다. 글자는 아래 구석에 작게."
      />
      <section className="mx-auto w-full max-w-(--container-max) px-6">
        <div className="relative h-[78svh]">
          <div className="absolute inset-0 flex">
            <div className="w-[60%]">
              <Plane src="pattern-clover" zoom={230} />
            </div>
            <div className="bg-cloud w-[40%]" />
          </div>

          {/* 경계를 물고 걸친 사진 한 장 */}
          <div className="absolute top-[18%] left-[42%] h-[56%] w-[38%]">
            <PhotoSlot label="상품 사진 하나 — 경계를 물고 걸친다" />
          </div>

          <div className="absolute bottom-8 left-8">
            <p className="text-ink text-title font-medium tracking-tight">
              버터웨더
            </p>
            <p className="text-ink-muted text-caption mt-1">
              나의 하루에 부드럽게 스며드는 작은 온기
            </p>
          </div>
        </div>
      </section>

      {/* ───────── C. 장면 넘김 ───────── */}
      <DraftLabel
        id="C"
        title="장면 넘김"
        note="한 화면에 다 담지 않고 장면을 넘깁니다. 장면마다 바탕이 바뀌는 것은 5-9절 「화면과 화면 사이는 넓혀도 된다」이고, sunlovetour가 실제로 이렇게 합니다. 아래 셋이 한 세트이며 각각이 한 화면입니다."
      />
      <section className="mx-auto w-full max-w-(--container-max) space-y-3 px-6">
        {/* 1장면 — 면과 이름만 */}
        <div className="relative h-[62svh]">
          <Plane src="pattern-flower-cluster" zoom={240} />
          <p className="text-ink text-title absolute bottom-6 left-6 bg-white px-3 py-1 font-medium tracking-tight">
            버터웨더
          </p>
        </div>

        {/* 2장면 — 여백과 상품 하나 */}
        <div className="bg-cloud flex h-[62svh] items-center justify-center">
          <div className="h-[62%] w-[38%]">
            <PhotoSlot label="상품 사진 하나 — 여백 가운데" />
          </div>
        </div>

        {/* 3장면 — 다른 면, 세로 글자 */}
        <div className="flex h-[62svh]">
          <div className="flex w-16 shrink-0 items-center justify-center bg-white">
            <span className="text-ink text-caption tracking-[0.3em] [writing-mode:vertical-rl]">
              LOOKBOOK
            </span>
          </div>
          <div className="flex-1">
            <Plane src="pattern-blue-flower" zoom={250} />
          </div>
        </div>
      </section>
    </div>
  )
}
