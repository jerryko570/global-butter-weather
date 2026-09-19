import AdminNav from '@/components/admin/AdminNav'

/**
 * 어드민 껍데기. **가게 화면의 `(shop)/layout.tsx` 와 다른 껍데기다** —
 * 손님이 보는 사이드바를 여기에 두지 않는다. 섞이면 지금 어디에 있는지
 * 헷갈린다.
 *
 * ⚠️ **이 layout 은 권한을 막지 않는다.** 주소를 아는 사람은 누구나 이
 * 화면을 열 수 있다. **막는 것은 RLS 다** — 관리자가 아니면 감춘 상품이
 * 조회되지 않고 쓰기가 전부 거부된다 (`0003`).
 *
 * 화면에서 막지 않는 것은 게으름이 아니다. 화면의 검사는 우회할 수 있고
 * DB 의 검사는 우회할 수 없다. **화면에서도 막고 싶어지면 그때 추가하되,
 * 그것을 유일한 방어로 삼지 말 것.**
 *
 * 검색 노출은 `src/app/robots.ts` 가 전부 막고 있다.
 */
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh">
      <AdminNav />
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
    </div>
  )
}
