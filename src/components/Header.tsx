import Link from 'next/link'

/**
 * 전역 헤더. 브랜드 문서 5-8절의 「틀」에 해당하므로 조용하게 둔다.
 * 색을 얹지 않고, 구분선도 넣지 않고, 높이와 정렬만 잡는다.
 *
 * 로고 자리는 비워 두었다. 여기는 곰이 놓일 「얼굴 자리」이고(5-8절),
 * 곰은 마스코트가 아니라 가면이라 아무 데나 놓지 않는다.
 * 자리 크기를 미리 잡아두어 로고가 들어와도 레이아웃이 밀리지 않게 한다.
 */
export default function Header() {
  return (
    <header
      className="flex shrink-0 items-center"
      style={{ height: 'var(--header-height)' }}
    >
      <div className="mx-auto flex w-full max-w-(--container-max) items-center px-6">
        <Link href="/" className="flex h-10 w-10 items-center">
          {/* 로고 자리 — 비어 있다 */}
          <span className="sr-only">버터웨더</span>
        </Link>
      </div>
    </header>
  )
}
