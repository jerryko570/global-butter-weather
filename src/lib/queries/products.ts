import { supabase } from '@/lib/supabase/client'
import type {
  ProductCategory,
  ProductDetail,
  ProductListItem,
  ProductVariant,
} from '@/types/product'

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

/**
 * 상세 화면이 읽는 것. **상품 하나 + 딸린 옵션 전부**를 한 번에 가져온다.
 *
 * 목록과 달리 `products_public` 뷰가 아니라 원본 테이블을 읽는다. 뷰는
 * 최저가·총재고로 **뭉갠 값**이라, 옵션마다 가격과 재고를 보여줘야 하는
 * 상세에서는 쓸 수 없다.
 *
 * `is_active = false` 인 상품과 옵션은 RLS 가 막는다 — 여기서 거르지
 * 않는 것이 아니라 **애초에 조회되지 않는다** (schema.md 4절).
 * 그래서 감춘 상품은 주소를 직접 쳐도 404 가 된다.
 */
export async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, variants:product_variants(*)')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('[products] 상세를 읽지 못했습니다:', error.message)
    return null
  }
  if (!data) return null

  // variant 가 하나도 없는 상품은 팔 수 없다 — 가격이 옵션에 붙어 있기
  // 때문이다. 목록에서는 뷰가 걸러주지만(join), 여기서는 직접 걸러야 한다.
  const variants = (data.variants ?? []).sort(
    (a: ProductVariant, b: ProductVariant) => a.position - b.position
  )
  if (variants.length === 0) return null

  return { ...data, variants }
}
