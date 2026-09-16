import { supabase } from '@/lib/supabase/client'
import type { ProductCategory, ProductListItem } from '@/types/product'

/**
 * 상품 목록. **`products_public` 뷰를 읽는다** — 원본 테이블이 아니다.
 * 뷰가 최저가·총재고를 계산해 주고, variant 없는 상품을 걸러낸다
 * (docs/dev/schema.md 5절).
 *
 * `is_active = false` 인 상품은 RLS 가 막으므로 여기서 거르지 않는다.
 * **거를 필요가 없는 것이 아니라 거를 수가 없다** — 애초에 조회되지 않는다.
 */
export async function getProducts(options?: {
  category?: ProductCategory
  limit?: number
}): Promise<ProductListItem[]> {
  let query = supabase
    .from('products_public')
    .select('*')
    .order('created_at', { ascending: false })

  if (options?.category) query = query.eq('category', options.category)
  if (options?.limit) query = query.limit(options.limit)

  const { data, error } = await query

  if (error) {
    // 목록이 비어 보이는 것과 못 읽은 것은 다른 일이다. 조용히 넘기면
    // 화면만 보고는 구분할 수 없다.
    console.error('[products] 목록을 읽지 못했습니다:', error.message)
    return []
  }

  return data ?? []
}

/** 화면에 쓰는 가격 표기. 정수(원)를 사람이 읽는 꼴로 바꾼다. */
export function formatKRW(won: number): string {
  return `₩${won.toLocaleString('ko-KR')}`
}
