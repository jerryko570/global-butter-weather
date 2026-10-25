import { redirect } from 'next/navigation'
import Link from 'next/link'
import Label from '@/components/Label'
import WithdrawButton from '@/components/WithdrawButton'
import { BUSINESS } from '@/lib/business'
import { createClient } from '@/lib/supabase/server'

/**
 * 내 정보. **지금은 탈퇴를 두기 위한 자리다.**
 *
 * 이용약관과 개인정보처리방침에 「말씀해 주시면 처리합니다」라고 적어
 * 두었는데, **탈퇴만큼은 화면에 있는 편이 낫다** — 나가겠다는 사람에게
 * 메일을 쓰게 하는 것은 붙잡는 것에 가깝다.
 *
 * 열람·정정은 아직 메일로 받는다. 보여줄 것이 이름과 이메일뿐이라
 * 화면을 만들 값어치가 아직 없다.
 */
export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=${encodeURIComponent('/account')}`)

  const meta = user.user_metadata ?? {}
  const name =
    (meta.name as string) ??
    (meta.full_name as string) ??
    (meta.preferred_username as string) ??
    ''

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 px-7 py-5">
        <h1 className="text-ink text-title font-serif">내 정보</h1>
        <Link
          href="/orders"
          className="text-ink-subtle hover:text-ink text-caption"
        >
          주문 내역
        </Link>
      </div>

      <div className="border-b border-gray-200 px-7 py-8">
        <dl className="border-t border-gray-200">
          {(
            [
              ['이름', name || '—'],
              ['이메일', user.email ?? '—'],
            ] as [string, string][]
          ).map(([k, v]) => (
            <div key={k} className="flex gap-4 border-b border-gray-200 py-3">
              <dt className="text-ink-subtle text-caption w-24 shrink-0">
                {k}
              </dt>
              <dd className="text-ink text-body">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-ink-subtle text-caption mt-3">
          구글·카카오에서 가져온 값입니다. 고치시려면 그쪽에서 바꾸시면 됩니다.
        </p>
      </div>

      <div className="flex flex-col gap-4 border-b border-gray-200 px-7 py-8">
        <Label>회원 탈퇴</Label>
        <WithdrawButton />
        <p className="text-ink-subtle text-caption">
          정보를 보거나 고치고 싶으시면 {BUSINESS.email} 로 말씀해 주세요.
        </p>
      </div>
    </>
  )
}
