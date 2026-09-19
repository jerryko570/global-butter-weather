import Label from '@/components/Label'

/** ⚠️ 링크는 아직 아무 데도 가지 않는다. 화면이 생기는 대로 잇는다. */
const FOOTER_COLS = [
  { title: 'SHOP', links: ['신상품', '키링', '팔찌', '목걸이'] },
  { title: 'ORDER', links: ['배송 안내', '교환·반품', '자주 묻는 질문'] },
  {
    title: 'BRAND',
    links: ['소개', 'Instagram', '네이버 스마트스토어', 'Contact'],
  },
]

export default function Footer() {
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
  )
}
