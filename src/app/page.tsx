/**
 * M1 첫 화면. 시안 셋 중 **B 분할형**으로 정해졌다 (PR #32).
 *
 * 왼쪽은 「틀」, 오른쪽은 「알맹이」다 (foundation.md 5-8절).
 * 둘은 겹치지 않고 **선명한 경계**로 갈린다 — 5-9절 「색을 섞지 않는다」를
 * layout 수준에서 지킨 것이다. 그라데이션·blur로 두 면을 잇지 말 것.
 *
 * **이 화면의 포인트는 pattern 하나다.** 예전 임시 화면에 있던 butter 색
 * 막대는 뺐다. pattern이 들어온 이상 포인트가 둘이 되기 때문이다
 * (5-8절 「한 화면에 포인트 하나」).
 *
 * 오른쪽은 이어붙인다(`repeat`). 늘리거나 잘라내지 않으므로 방울의 크기가
 * 화면 폭에 따라 변하지 않는다 — 5-9절 「한 화면 안에서는 크기를 통일한다」.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col md:flex-row">
      {/* 틀 — 조용하다. 배경은 --cloud 그대로 두고 색을 얹지 않는다 */}
      <div className="flex flex-1 items-center px-6 py-16 md:justify-end md:py-0 md:pr-16">
        <div className="w-full max-w-md md:max-w-sm">
          <h1 className="text-ink text-display font-medium tracking-tight">
            버터웨더
          </h1>
          <p className="text-ink-muted text-body mt-3">
            나의 하루에 부드럽게 스며드는 작은 온기
          </p>
        </div>
      </div>

      {/* 알맹이 — 이나래의 빗방울로 만든 pattern (5-12절). 자리를 꽉 채운다 */}
      <div
        className="min-h-[46svh] flex-1 bg-repeat md:min-h-0"
        style={{
          backgroundImage: 'url(/illustrations/derived/pattern-rain.svg)',
          backgroundSize: '234px 279px',
        }}
        aria-hidden
      />
    </main>
  )
}
