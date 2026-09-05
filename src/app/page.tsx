// M0 임시 화면 — app shell이 뜨는지 확인하는 최소본이다.
// 첫 화면에 무엇을 둘지는 M1에서 정한다 (docs/plan/roadmap.md 열린 결정 1번).
// 지금은 5-8절 「틀과 알맹이」만 지킨다 — 틀은 조용하게, 액센트는 한 화면에 하나만.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-(--container-max) flex-1 items-center px-6">
      <div>
        <h1 className="text-ink text-2xl font-medium tracking-tight">
          버터웨더
        </h1>
        <p className="text-ink-muted mt-3 text-sm">
          나의 하루에 부드럽게 스며드는 작은 온기
        </p>
        {/* 이 화면의 유일한 포인트. 원색은 면적이 아니라 포인트로 쓴다. */}
        <span className="bg-butter mt-8 block h-1 w-8" aria-hidden />
      </div>
    </main>
  )
}
