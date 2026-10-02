import Label from '@/components/Label'
import { businessRows } from '@/lib/business'

/** ⚠️ 링크는 아직 아무 데도 가지 않는다. 화면이 생기는 대로 잇는다. */
const FOOTER_COLS = [
  { title: '상품', links: ['신상품', '키링', '팔찌', '목걸이'] },
  { title: '주문', links: ['배송 안내', '교환·반품', '자주 묻는 질문'] },
  {
    title: '브랜드',
    links: ['소개', 'Instagram', '네이버 스마트스토어', '문의'],
  },
]

export default function Footer() {
  const rows = businessRows()

  return (
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

      {/* ── 사업자 정보 ──────────────────────────────────────
          **전자상거래법이 요구하는 표기다.** 결제 심사도 여기를 본다
          (lib/business.ts). 비어 있으면 통째로 그리지 않는다 — 빈 값에
          라벨만 띄우면 「상호: 」 같은 것이 손님에게 보인다 */}
      {rows.length > 0 ? (
        <div className="border-t border-gray-200 px-7 py-5">
          <dl className="text-ink-subtle text-caption flex flex-wrap gap-x-5 gap-y-1.5">
            {rows.map(([k, v]) => (
              <div key={k} className="flex gap-1.5">
                <dt className="text-ink-subtle">{k}</dt>
                <dd className="text-ink-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-gray-200 px-7 py-4">
        <p className="text-ink-subtle text-caption">© 2026 Butter Weather</p>
        <div className="flex items-center gap-4">
          <span className="text-ink text-caption">KR</span>
          <span className="text-ink-subtle hover:text-ink text-caption">
            EN
          </span>
        </div>
      </div>
    </footer>
  )
}
