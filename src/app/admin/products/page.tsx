import Image from 'next/image'
import Link from 'next/link'
import Label from '@/components/Label'
import DeleteProductButton from '@/components/admin/DeleteProductButton'
import { imageUrl } from '@/lib/images'
import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/types/product'

/**
 * 상품 목록. **server component 다** — 쿠키의 세션을 서버에서 읽으므로
 * 첫 화면부터 값이 채워져 나온다. 빈 목록이 잠깐 보였다 채워지지 않는다.
 *
 * **감춘 상품까지 보인다** — 관리자로 로그인했을 때 이야기다. 로그인하지
 * 않으면 같은 쿼리가 공개된 것만 돌려준다. 거르는 코드가 없는데 나뉘는
 * 이유는 RLS 다 (`0003`, docs/dev/schema.md 4절).
 *
 * 그 차이를 화면이 말해 준다. 안 그러면 「왜 방금 만든 상품이 안 보이지」
 * 에서 멈춘다.
 */

/** 로그인 상태에 따라 결과가 달라지므로 굽어 두면 안 된다 */
export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  const products = (data ?? []) as Product[]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-ink text-title font-serif">상품</h1>
          <p className="text-ink-subtle text-caption mt-1">
            {products.length}개
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-ink text-cloud text-caption px-6 py-3 tracking-widest uppercase"
        >
          + 새 상품
        </Link>
      </div>

      {error ? (
        <p className="text-caption border border-red-200 bg-red-50 p-3 text-red-600">
          불러오지 못했습니다 — {error.message}
        </p>
      ) : null}

      {products.length === 0 ? (
        <div className="border border-gray-200 px-6 py-16 text-center">
          <p className="text-ink-muted text-body">상품이 없습니다.</p>
          <p className="text-ink-subtle text-caption mt-2">
            감춘 상품이 있는데 안 보인다면 관리자로 로그인하지 않은 것입니다.
          </p>
        </div>
      ) : (
        <div className="border-t border-gray-200">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 border-b border-gray-200 py-4"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-gray-100">
                {p.images[0] ? (
                  <Image
                    src={imageUrl(p.images[0])}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <Label className="mb-1">{p.category}</Label>
                <p className="text-ink text-body truncate">{p.name}</p>
                <p className="text-ink-subtle text-caption truncate">
                  {p.slug}
                </p>
              </div>

              <span
                className={`text-caption shrink-0 border px-2 py-1 ${
                  p.is_active
                    ? 'text-ink-muted border-gray-300'
                    : 'text-ink-subtle border-gray-200'
                }`}
              >
                {p.is_active ? '보임' : '감춤'}
              </span>

              <Link
                href={`/admin/products/${p.id}/edit`}
                className="text-ink-muted hover:text-ink text-caption shrink-0"
              >
                수정
              </Link>
              <DeleteProductButton id={p.id} name={p.name} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
