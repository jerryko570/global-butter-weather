import Sidebar from '@/components/Sidebar'
import AccountBar from '@/components/AccountBar'
import Footer from '@/components/Footer'

/**
 * 가게 화면의 껍데기. **사이드바·상단 줄·footer는 여기 한 번만 둔다.**
 *
 * 옛 레포(`jerryko570/butter-weather-shop`)도 `(shop)/layout.tsx` 로 같은
 * 구조였다. 계승한 디자인이 「왼쪽 고정 사이드바 + 본문」이라 화면마다
 * 껍데기를 다시 그리면 250줄이 복사된다.
 *
 * `(shop)` 은 route group 이라 **주소에 안 나타난다** — `/` 와
 * `/products/<slug>` 그대로다. 껍데기를 공유하는 화면을 묶는 표시일 뿐이다.
 *
 * 부수 효과로 화면을 옮겨도 사이드바가 다시 그려지지 않는다.
 */
export default function ShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="lg:flex lg:min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AccountBar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  )
}
