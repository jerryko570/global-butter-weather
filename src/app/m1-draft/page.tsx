import Image from 'next/image'
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

/**
 * 상품 사진. 2025년에 찍은 것이고 **앞으로 바뀐다** (5-11절 — 새로 촬영할 예정).
 * 지금 넣은 이유는 점선 자리로는 「쨍한 면 / 차분한 상품」의 대비가 보이지
 * 않기 때문이다. 비율을 굳히지 않으려고 `object-cover`로만 받는다.
 */
function Photo({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative h-full w-full bg-white">
      <Image
        src={`/photos/${src}.jpg`}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 40vw"
        className="object-cover"
      />
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

/**
 * 모티프 하나를 메뉴 버튼으로 쓴다. 각 SVG가 이미 자기 바탕색을 품고 있어서
 * (5-11절) 그대로 얹으면 색 칩이 된다. 크기는 전부 같고 **높이만 어긋난다** —
 * 크기를 제각각 두지 않는다는 5-9절을 지키면서 리듬을 만드는 방법이다.
 */
function MotifChip({
  src,
  label,
  drop,
}: {
  src: string
  label: string
  drop: number
}) {
  return (
    <div className="flex flex-col items-center" style={{ marginTop: drop }}>
      <div
        className="h-[114px] w-[96px] bg-cover bg-center"
        style={{ backgroundImage: `url(/illustrations/${src}.svg)` }}
        aria-hidden
      />
      <span className="text-ink text-caption mt-2 tracking-[0.2em]">
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
          반으로 가르지 않습니다. 상품 사진은 2025년에 찍은 것이라 앞으로
          바뀌고, 컬러 면에 쓴 일러스트도 자리를 보이기 위한 것이지 고른 것이
          아닙니다.{' '}
          <strong className="text-ink font-medium">
            D는 앞의 셋과 종류가 다릅니다
          </strong>{' '}
          — 일러스트 면을 쓰지 않습니다.
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
            <Photo src="keyring-on-paper" alt="종이 위에 놓인 비즈 키링" />
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
            <Photo src="keyring-on-phone" alt="휴대폰 뒷면에 걸린 비즈 키링" />
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
            <Photo
              src="keyring-on-wood"
              alt="나무 위 주황 원 카드에 놓인 비즈 키링"
            />
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

      {/* ───────── D. 사진이 면을 품는다 ───────── */}
      <DraftLabel
        id="D"
        title="사진이 면을 품는다"
        note="앞의 셋과 종류가 다릅니다. 일러스트 면을 따로 두지 않고, 이미 쨍한 바닥 위에서 찍힌 사진 한 장을 그대로 씁니다. 5-13절의 두 층(쨍한 아이덴티티 · 차분한 상품)이 화면 배치가 아니라 사진 한 장 안에서 성립합니다. 흰 띠는 사진을 가로지르며 틈을 만들고, 글자는 거기에만 있습니다."
      />
      <section className="mx-auto w-full max-w-(--container-max) px-6">
        <div className="relative h-[78svh]">
          <Photo
            src="keyring-on-orange-pattern"
            alt="주황 레트로 패턴 바닥 위에 놓인 비즈 키링"
          />

          {/* 틈 — 사진을 가로질러 낸다. UI는 여기에만 산다 */}
          <div className="absolute inset-y-0 right-[22%] flex w-16 flex-col items-center justify-between bg-white py-8">
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
        </div>
        <p className="text-ink-muted text-caption mt-3">
          ⚠️ 이 사진의 원본이 583px이라 화면을 채우면 흐릿합니다. 새로 촬영하면
          해결되는 문제이고, 지금은 배치만 봐주세요.
        </p>
      </section>

      <div className="mx-auto w-full max-w-(--container-max) px-6 pt-24">
        <p className="text-ink text-title font-medium tracking-tight">
          여기부터는 다른 자리에 감각을 싣습니다
        </p>
        <p className="text-ink-muted text-body mt-3 max-w-prose">
          A~D는 전부 「틈」 하나에만 감각을 실었습니다. 그래서 서로 닮아
          보였습니다. E·F·G는 각각{' '}
          <strong className="text-ink font-medium">
            내비게이션 · 구획선 · 바닥
          </strong>
          에 감각을 싣습니다.
        </p>
      </div>

      {/* ───────── E. 모티프가 메뉴가 된다 ───────── */}
      <DraftLabel
        id="E"
        title="모티프가 메뉴가 된다"
        note="감각을 내비게이션에 싣습니다. 이나래의 모티프 하나하나가 그대로 메뉴 버튼이 됩니다 — 각 SVG가 이미 자기 바탕색을 품고 있어서 얹기만 하면 색 칩이 됩니다. 크기는 전부 같고 높이만 어긋납니다. 화면의 나머지는 조용하고, 색은 메뉴에만 있습니다."
      />
      <section className="mx-auto w-full max-w-(--container-max) px-6">
        <div className="bg-cloud flex h-[78svh] flex-col">
          <div className="flex items-start justify-center gap-6 pt-12">
            <MotifChip src="motif-tulip" label="SHOP" drop={0} />
            <MotifChip src="motif-cloud-rainbow" label="LOOKBOOK" drop={30} />
            <MotifChip src="motif-sun" label="ABOUT" drop={8} />
            <MotifChip src="motif-watering-can" label="CARE" drop={38} />
            <MotifChip src="motif-blue-flower" label="CONTACT" drop={16} />
          </div>
          <div className="flex flex-1 items-center justify-center px-10 pb-10">
            <div className="h-[80%] w-[46%]">
              <Photo src="keyring-with-jar" alt="유리병 옆에 놓인 비즈 키링" />
            </div>
          </div>
        </div>
      </section>

      {/* ───────── F. 여백 없이 맞닿는다 ───────── */}
      <DraftLabel
        id="F"
        title="여백 없이 맞닿는다"
        note="감각을 구획선에 싣습니다. 사진과 일러스트 면을 여백 0으로 붙여서 격자 자체가 하나의 덩어리가 되고, 그 사이를 원색 가로 띠가 한 줄 가릅니다. 띠 양끝에 단어 하나씩 — BAGGU의 방식입니다. 룩북(사진)과 샵(상품)이 한 화면에 같이 있습니다."
      />
      <section className="mx-auto w-full max-w-(--container-max) px-6">
        <div className="grid h-[42svh] grid-cols-4 gap-0">
          <Photo src="keyring-on-paper" alt="종이 위에 놓인 비즈 키링" />
          <Plane src="pattern-clover" zoom={200} />
          <Photo src="keyring-on-phone" alt="휴대폰에 걸린 비즈 키링" />
          <Plane src="pattern-blue-flower" zoom={200} />
        </div>
        {/* 구획선 — 띠가 나누고, 양끝에 단어 하나씩 */}
        <div className="bg-butter flex items-center justify-between px-6 py-3">
          <span className="text-ink text-body font-medium tracking-[0.2em]">
            SHOP
          </span>
          <span className="text-ink text-body font-medium tracking-[0.2em]">
            LOOKBOOK
          </span>
        </div>
        <div className="grid h-[42svh] grid-cols-4 gap-0">
          <Plane src="pattern-flower-cluster" zoom={200} />
          <Photo src="keyring-on-wood" alt="나무 위에 놓인 비즈 키링" />
          <Plane src="pattern-berry-branch" zoom={200} />
          <Photo
            src="keyring-on-orange-pattern"
            alt="주황 패턴 바닥 위의 비즈 키링"
          />
        </div>
      </section>

      {/* ───────── G. 바닥이 바뀐다 ───────── */}
      <DraftLabel
        id="G"
        title="바닥이 바뀐다"
        note="감각을 바닥에 싣습니다. 레이아웃은 거의 없습니다 — 상품이 가로로 나란히 놓이고, 그 아래 깔린 바닥만 장면마다 바뀝니다. 상품을 흰 카드에 담지 않고 색면 위에 직접 올리는 Susan Alexandra의 방식입니다. 샵 목록이 그대로 룩북이 됩니다."
      />
      <section className="mx-auto w-full max-w-(--container-max) px-6">
        <div className="relative h-[52svh]">
          <Plane src="pattern-red-berry" zoom={200} />
          <div className="absolute inset-0 flex items-center justify-center gap-6 px-10">
            <div className="h-[62%] w-[26%]">
              <Photo src="keyring-on-paper" alt="비즈 키링" />
            </div>
            <div className="h-[62%] w-[26%]">
              <Photo src="keyring-with-jar" alt="비즈 키링" />
            </div>
            <div className="h-[62%] w-[26%]">
              <Photo src="keyring-on-wood" alt="비즈 키링" />
            </div>
          </div>
        </div>
        <div className="relative mt-3 h-[52svh]">
          <Plane src="pattern-clover" zoom={200} />
          <div className="absolute inset-0 flex items-center justify-center gap-6 px-10">
            <div className="h-[62%] w-[26%]">
              <Photo src="keyring-on-phone" alt="비즈 키링" />
            </div>
            <div className="h-[62%] w-[26%]">
              <Photo src="keyring-on-orange-pattern" alt="비즈 키링" />
            </div>
            <div className="h-[62%] w-[26%]">
              <Photo src="keyring-on-paper" alt="비즈 키링" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
