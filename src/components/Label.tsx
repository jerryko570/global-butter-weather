/**
 * 10~11px 대문자 라벨. **계승한 디자인에서 가장 자주 쓰이는 조각이다**
 * (CLAUDE.md 1절). 아주 작고 조용해야 한다 — 크게 만들지 말 것.
 */
export default function Label({
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
