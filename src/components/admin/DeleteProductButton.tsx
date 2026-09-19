'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteProduct } from '@/lib/queries/adminProducts'
import { revalidateShop } from '@/app/admin/actions'
import { useToast } from '@/components/Toast'

/**
 * 목록의 삭제 단추. **목록 자체는 server component 라 여기만 client 다.**
 *
 * 지우고 나면 `router.refresh()` 로 서버에서 목록을 다시 받는다. 화면에서
 * 한 줄만 빼면 실제로 지워졌는지와 어긋날 수 있다.
 */
export default function DeleteProductButton({
  id,
  name,
}: {
  id: string
  name: string
}) {
  const router = useRouter()
  const { show } = useToast()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    // 되돌릴 수 없는 일이라 한 번 묻는다. 옵션도 같이 지워진다.
    if (
      !window.confirm(
        `"${name}" 을(를) 지울까요?\n옵션도 같이 지워지고 되돌릴 수 없습니다.\n(저장소의 사진은 남습니다)`
      )
    ) {
      return
    }
    setBusy(true)
    try {
      await deleteProduct(id)
      await revalidateShop()
      show(`"${name}" 을(를) 지웠습니다`)
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : '지우지 못했습니다.'
      setError(msg)
      show(msg, 'fail')
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="shrink-0">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="text-ink-subtle text-caption hover:text-red-600 disabled:opacity-40"
      >
        {busy ? '지우는 중…' : '삭제'}
      </button>
      {error ? (
        <span className="text-caption ml-2 text-red-600">{error}</span>
      ) : null}
    </span>
  )
}
