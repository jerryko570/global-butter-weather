import Link from 'next/link'
import Label from '@/components/Label'

/**
 * 가게 화면 안에서 못 찾았을 때. **껍데기 안에 그려진다** — 사이드바가
 * 남아 있어야 손님이 길을 잃지 않는다.
 *
 * 감춘 상품(`is_active = false`)도 여기로 온다. 「없는 주소」와 「감춘
 * 상품」을 밖에서 구분할 수 없어야 하므로 문구를 나누지 않는다.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-7 py-20 text-center">
      <Label className="mb-5">Not Found</Label>
      <h1 className="text-ink text-title mb-4 font-serif">
        찾으시는 상품이 없습니다.
      </h1>
      <p className="text-ink-muted text-body mb-10 font-light">
        주소가 바뀌었거나 판매가 끝난 상품일 수 있습니다.
      </p>
      <Link
        href="/"
        className="bg-ink text-cloud text-caption px-7 py-3 tracking-widest uppercase"
      >
        홈으로
      </Link>
    </div>
  )
}
