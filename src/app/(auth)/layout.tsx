/**
 * 로그인 화면의 껍데기. **`(shop)` 밖이라 사이드바·footer 가 안 붙는다.**
 *
 * 옛 레포도 그랬다 — `(auth)/layout.tsx` 의 주석에 「(shop) 그룹 밖이라
 * 헤더·사이드바·푸터가 안 붙고, 중앙 정렬된 깔끔한 화면이 된다」고
 * 적혀 있다. 계승한다.
 *
 * 로그인은 **가게를 둘러보는 일이 아니라 지나가는 문**이다. 문에 진열대를
 * 붙여둘 이유가 없다.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6 py-16">
      {children}
    </div>
  )
}
