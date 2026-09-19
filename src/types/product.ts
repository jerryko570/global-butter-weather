/**
 * 상품 타입. **`supabase/migrations/0001_products.sql` 과 1:1로 맞춘다.**
 * 스키마를 고치면 이 파일도 같이 고칠 것 — 어긋나면 타입은 통과하는데
 * 런타임에 `undefined` 가 흐른다.
 *
 * 설계 근거는 docs/dev/schema.md.
 */

/** 형태로 나눈다. 소재가 아니다 (foundation.md 8절 1번). */
export type ProductCategory = 'keyring' | 'bracelet' | 'necklace'

/** 판매 상태. **노출 여부(`is_active`)와 다른 축이다.** */
export type ProductStatus = 'active' | 'sold_out'

/** 「물건」. 가격과 재고는 여기 없다 — 그것은 파는 단위의 성질이다. */
export interface Product {
  id: string
  slug: string
  name: string
  name_en: string | null
  description: string | null
  description_en: string | null
  category: ProductCategory
  tags: string[]
  /** 목록·상세 상단에 쓰는 사진 */
  images: string[]
  /** 세로로 길게 쌓이는 설명 이미지. `images` 와 섞지 않는다 */
  detail_images: string[]
  status: ProductStatus
  is_active: boolean
  created_at: string
  updated_at: string
}

/** 「파는 단위」. 옵션마다 가격과 재고가 다르다. */
export interface ProductVariant {
  id: string
  product_id: string
  name: string
  name_en: string | null
  /** 원 단위 정수 */
  price_krw: number
  /** 센트 단위 정수. 해외에 안 파는 물건은 null */
  price_usd: number | null
  stock: number
  is_active: boolean
  /** 화면에 보이는 순서 */
  position: number
  created_at: string
  updated_at: string
}

/**
 * `products_public` 뷰. 목록 화면이 읽는 것은 이쪽이다.
 *
 * 「얼마부터인가」와 「살 수 있나」를 DB 가 계산해 준다 — 화면마다
 * 다시 계산하면 규칙이 흩어진다. variant 가 없는 상품은 아예 나오지 않는다.
 */
export interface ProductListItem extends Product {
  min_price_krw: number
  min_price_usd: number | null
  total_stock: number
  variant_count: number
}

/**
 * 상세 화면이 읽는 꼴. **옵션을 뭉개지 않고 그대로 들고 있다.**
 *
 * 목록의 `ProductListItem` 과 다른 타입인 것이 중요하다 — 목록은 최저가·
 * 총재고만 있으면 되고, 상세는 옵션마다 가격과 재고를 보여줘야 한다.
 * 하나로 합치면 목록에서 쓰지도 않을 옵션 배열을 늘 끌고 다니게 된다.
 */
export interface ProductDetail extends Product {
  /** `position` 순으로 정렬돼 있다 */
  variants: ProductVariant[]
}
