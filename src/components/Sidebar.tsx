import Link from 'next/link'
import Label from '@/components/Label'
import ThemeToggle from '@/components/ThemeToggle'

/**
 * 왼쪽 고정 사이드바. **화면마다 다시 그리지 않는다** — `(shop)/layout.tsx`
 * 가 한 번만 두고 본문만 갈아 끼운다.
 *
 * 계승한 조형 (CLAUDE.md 1절). 지우지 말 것.
 * - 구획마다 `gray-200` 얇은 실선. 선을 걷어내면 이 디자인이 아니다
 * - 워드마크와 태그라인은 serif, 태그라인은 italic
 * - 라벨은 10~11px 대문자
 *
 * **전역 Header는 없다.** 첫 화면이 이 구조로 정해지면서 상단 bar가 자리를
 * 잃었다 (2026-09-15). ThemeToggle 같은 전역 제어는 여기가 맡는다.
 */

/**
 * 2026-09-16에 확정됐다. **소재가 아니라 형태로 나눈다** — 「비즈」는
 * 재료 이름이었고 「팔찌·목걸이」는 몸의 어디에 걸리는지다.
 *
 * 모티프 배정은 형태를 따라갔다 — 팔찌는 호를 그리는 무지개, 목걸이는
 * 줄기가 아래로 늘어지는 꽃. 바꿔도 되는 부분이다.
 */
const CATEGORIES = [
  { motif: 'motif-sun', label: '전체', active: true },
  { motif: 'motif-tulip', label: '키링' },
  { motif: 'motif-rainbow', label: '팔찌' },
  { motif: 'motif-blue-flower', label: '목걸이' },
]

export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-gray-200 lg:flex">
      <div className="border-b border-gray-200 px-6 py-5">
        <Link href="/" className="text-ink text-wordmark font-serif uppercase">
          Butter Weather
        </Link>
      </div>

      <div className="border-b border-gray-200 px-6 py-6">
        <Label className="mb-3">Shop</Label>
        <nav className="flex flex-col gap-1">
          {CATEGORIES.map((c) => (
            <a key={c.label} href="#" className="group flex items-center gap-3">
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
  )
}
