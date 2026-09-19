'use client'

import { use, useEffect, useState } from 'react'
import ProductForm from '@/components/admin/ProductForm'
import { getProduct } from '@/lib/queries/adminProducts'
import type { ProductDetail } from '@/types/product'

/**
 * 상품 수정. 폼은 등록과 같은 것을 쓴다.
 *
 * 값을 받아와야 폼을 채울 수 있으므로 **받기 전에는 폼을 그리지 않는다.**
 * 빈 폼을 먼저 그리고 나중에 채우면, 그 사이에 저장을 누른 사람이
 * 상품을 빈 값으로 덮어쓴다.
 */
export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProduct(id)
      .then((p) => {
        if (!p) {
          setError(
            '상품을 찾지 못했습니다. 감춘 상품이라면 관리자로 로그인해 주세요.'
          )
          return
        }
        setProduct(p)
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : '불러오지 못했습니다.')
      )
  }, [id])

  if (error) {
    return (
      <p className="text-caption border border-red-200 bg-red-50 p-3 text-red-600">
        {error}
      </p>
    )
  }

  if (!product) {
    return (
      <p className="text-ink-subtle text-caption py-16 text-center">
        불러오는 중…
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-ink text-title font-serif">{product.name}</h1>
        <p className="text-ink-subtle text-caption mt-1">{product.slug}</p>
      </div>
      <ProductForm initial={product} />
    </div>
  )
}
