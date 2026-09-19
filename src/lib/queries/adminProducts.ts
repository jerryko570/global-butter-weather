'use client'

import { createClient } from '@/lib/supabase/browser'
import type { Product, ProductDetail, ProductVariant } from '@/types/product'

/**
 * 어드민이 쓰는 읽기·쓰기.
 *
 * 손님용 `products.ts` 와 나눠 둔 이유는 **보는 범위가 다르기** 때문이다.
 * 여기서는 감춘 상품(`is_active = false`)까지 보여야 관리가 된다.
 *
 * **거르는 코드가 없는데 어떻게 나뉘는가** — RLS 가 나눈다. 로그인하지
 * 않은 사람에게는 같은 쿼리가 공개된 것만 돌려준다 (`0003`,
 * docs/dev/schema.md 4절). 화면이 권한을 판단하지 않는다.
 *
 * ⚠️ 그래서 **이 파일의 함수가 조용히 빈 결과를 줄 수 있다.** 쓰기도
 * 마찬가지다 — 관리자가 아니면 에러가 아니라 「0행 변경」으로 끝난다.
 * 그래서 아래 쓰기 함수들은 전부 결과를 돌려받아 확인한다.
 */

/** 폼이 채우는 값. id·시각은 DB 가 만든다 */
export type ProductInput = Omit<
  Product,
  'id' | 'created_at' | 'updated_at' | 'detail_images' | 'tags'
> & {
  tags: string[]
  detail_images: string[]
}

/** 폼이 채우는 옵션 한 줄. 기존 것은 id 가 있고 새 것은 없다 */
export type VariantInput = {
  id?: string
  name: string
  name_en: string | null
  price_krw: number
  stock: number
  position: number
}

/** 목록 — 감춘 것 포함, 최신순 */
export async function listProducts(): Promise<Product[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

/** 하나 — 수정 폼을 채울 때. 옵션까지 같이 가져온다 */
export async function getProduct(id: string): Promise<ProductDetail | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, variants:product_variants(*)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null

  const variants = (data.variants ?? []).sort(
    (a: ProductVariant, b: ProductVariant) => a.position - b.position
  )
  return { ...data, variants }
}

/**
 * 등록. **상품과 옵션을 같이 넣는다.**
 *
 * 옵션 없는 상품은 화면에 안 나온다 — 가격이 옵션에 붙어 있어 목록 뷰가
 * `join` 으로 걸러낸다 (schema.md 5절). 그래서 여기서 둘을 따로 저장하게
 * 두지 않는다.
 */
export async function createProduct(
  input: ProductInput,
  variants: VariantInput[]
): Promise<string> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('products')
    .insert(input)
    .select('id')
    .single()

  // 관리자가 아니면 여기서 42501 이 온다. 조용히 넘기면 폼만 초기화되고
  // 아무것도 저장되지 않은 것을 알 수 없다.
  if (error) throw new Error(error.message)

  const productId = data.id as string
  await replaceVariants(productId, variants)
  return productId
}

/** 수정 */
export async function updateProduct(
  id: string,
  input: ProductInput,
  variants: VariantInput[]
): Promise<void> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .update(input)
    .eq('id', id)
    .select('id')

  if (error) throw new Error(error.message)
  // RLS 가 막으면 에러 없이 0행이 돌아온다. 이 확인이 없으면 「저장됐다」고
  // 말해 놓고 아무것도 안 바뀌는 일이 생긴다.
  if (!data || data.length === 0) {
    throw new Error('저장되지 않았습니다. 관리자로 로그인했는지 확인해 주세요.')
  }

  await replaceVariants(id, variants)
}

/**
 * 옵션을 통째로 갈아 끼운다.
 *
 * 하나씩 비교해 넣고 고치고 지우는 대신 **지우고 다시 넣는다.** 옵션은
 * 많아야 몇 개고, 순서까지 맞추려면 비교 쪽이 훨씬 복잡해진다.
 *
 * ⚠️ 주문이 붙으면 이 방식을 못 쓴다 — 주문이 variant 를 가리키고 있으면
 * 지우는 순간 끊어진다. M3 에서 다시 판단할 것.
 */
async function replaceVariants(
  productId: string,
  variants: VariantInput[]
): Promise<void> {
  const supabase = createClient()

  const { error: delError } = await supabase
    .from('product_variants')
    .delete()
    .eq('product_id', productId)
  if (delError) throw new Error(delError.message)

  const rows = variants.map((v, i) => ({
    product_id: productId,
    name: v.name,
    name_en: v.name_en || null,
    price_krw: v.price_krw,
    stock: v.stock,
    position: i,
  }))

  const { error } = await supabase.from('product_variants').insert(rows)
  if (error) throw new Error(error.message)
}

/** 삭제. 옵션은 `on delete cascade` 로 같이 지워진다 */
export async function deleteProduct(id: string): Promise<void> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) {
    throw new Error('삭제되지 않았습니다. 관리자로 로그인했는지 확인해 주세요.')
  }
}

/**
 * 사진 업로드. **`<slug>/01.jpg` 규칙을 코드가 지킨다** (schema.md 7절).
 *
 * 옛 레포는 버킷 루트에 난수 이름으로 올리고 **전체 주소**를 DB 에 넣었다.
 * 그 부분만 계승하지 않는다 — 전체 주소를 넣으면 프로젝트가 바뀔 때 모든
 * 행을 고쳐야 한다. 여기서는 **경로만** 돌려준다.
 *
 * **여러 장을 한 번에 받는다.** 한 장씩 부르면 폴더 목록을 장마다 다시
 * 읽게 되어 왕복이 두 배가 된다. 처음에 그렇게 짰다가 느려서 고쳤다
 * (2026-09-19).
 *
 * 순서는 지킨다 — 번호가 고른 순서를 따라가야 대표 사진을 예측할 수 있다.
 * 올리기 자체는 한 장씩 기다린다. 같은 번호를 두 장이 가져가면 안 된다.
 *
 * 줄이는 것은 `compressImage` 가 한다. 여기서는 받은 파일을 그대로 올린다.
 */
export async function uploadProductImages(
  slug: string,
  files: File[]
): Promise<string[]> {
  if (!slug) throw new Error('slug 를 먼저 입력해 주세요. 폴더 이름이 됩니다.')

  const supabase = createClient()

  // 폴더 목록은 **한 번만** 읽는다. 다음 번호는 여기서 세어 나간다
  const { data: existing } = await supabase.storage
    .from('product-images')
    .list(slug, { limit: 1000 })

  let next =
    (existing ?? []).reduce((max, f) => {
      const n = Number(f.name.split('.')[0])
      return Number.isFinite(n) && n > max ? n : max
    }, 0) + 1

  const paths: string[] = []
  for (const file of files) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${slug}/${String(next).padStart(2, '0')}.${ext}`

    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) throw new Error(error.message)

    paths.push(path)
    next += 1
  }

  return paths
}
