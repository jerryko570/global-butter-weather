/**
 * 입력값의 최대·최소. **`supabase/migrations/0004_input_limits.sql` 과
 * 1:1로 맞춘다.**
 *
 * 기준은 DB 의 `CHECK` 제약이고 이 파일은 **그것을 따라 적은 것**이다.
 * 화면의 검사는 우회할 수 있고 DB 의 검사는 못 한다. 여기서 막는 이유는
 * 안전이 아니라 **알려주기 위해서다** — 저장을 눌렀다가 DB 에서 튕기면
 * 어느 칸이 문제인지 알 수 없다.
 *
 * ⚠️ 값을 고칠 일이 생기면 **마이그레이션을 먼저 고치고** 여기를 맞춘다.
 * 반대로 하면 폼은 통과하는데 저장이 안 되는 상태가 된다.
 *
 * 설계 근거와 표는 docs/dev/schema.md 7-2절.
 */

export const LIMITS = {
  slug: { min: 3, max: 60, pattern: /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/ },
  name: { min: 1, max: 100 },
  nameEn: { max: 100 },
  description: { max: 2000 },
  images: { max: 10 },
  variantName: { min: 1, max: 40 },
  variantNameEn: { max: 40 },
  priceKrw: { min: 0, max: 10_000_000 },
  stock: { min: 0, max: 9_999 },
  /** 행 개수는 `CHECK` 로 쓸 수 없어 **폼에서만** 막는다 (schema.md 7-2절) */
  variants: { min: 1, max: 20 },
} as const

type Draft = {
  slug: string
  name: string
  nameEn: string
  description: string
  images: string[]
  variants: {
    name: string
    name_en: string | null
    price_krw: number
    stock: number
  }[]
}

/**
 * 어긋난 것을 **전부** 모아 돌려준다. 하나씩 알려주면 고치고 누르고를
 * 반복하게 된다. 비어 있으면 통과다.
 */
export function validateProduct(d: Draft): string[] {
  const errors: string[] = []
  const slug = d.slug.trim()
  const name = d.name.trim()

  if (!LIMITS.slug.pattern.test(slug)) {
    errors.push(
      `slug 는 영문 소문자·숫자·하이픈으로 ${LIMITS.slug.min}~${LIMITS.slug.max}자입니다. 하이픈으로 시작하거나 끝날 수 없습니다.`
    )
  }
  if (name.length < LIMITS.name.min || name.length > LIMITS.name.max) {
    errors.push(`이름은 ${LIMITS.name.min}~${LIMITS.name.max}자입니다.`)
  }
  if (d.nameEn.length > LIMITS.nameEn.max) {
    errors.push(`영문 이름은 ${LIMITS.nameEn.max}자까지입니다.`)
  }
  if (d.description.length > LIMITS.description.max) {
    errors.push(
      `설명은 ${LIMITS.description.max}자까지입니다. 지금 ${d.description.length}자입니다.`
    )
  }
  if (d.images.length > LIMITS.images.max) {
    errors.push(`사진은 ${LIMITS.images.max}장까지입니다.`)
  }

  if (d.variants.length < LIMITS.variants.min) {
    errors.push(
      '옵션이 없는 상품은 화면에 나오지 않습니다. 한 줄은 있어야 합니다.'
    )
  }
  if (d.variants.length > LIMITS.variants.max) {
    errors.push(`옵션은 ${LIMITS.variants.max}개까지입니다.`)
  }

  d.variants.forEach((v, i) => {
    const label = `옵션 ${i + 1}`
    const vName = v.name.trim()
    if (
      vName.length < LIMITS.variantName.min ||
      vName.length > LIMITS.variantName.max
    ) {
      errors.push(
        `${label} 이름은 ${LIMITS.variantName.min}~${LIMITS.variantName.max}자입니다.`
      )
    }
    if ((v.name_en ?? '').length > LIMITS.variantNameEn.max) {
      errors.push(
        `${label} 영문 이름은 ${LIMITS.variantNameEn.max}자까지입니다.`
      )
    }
    if (
      !Number.isInteger(v.price_krw) ||
      v.price_krw < LIMITS.priceKrw.min ||
      v.price_krw > LIMITS.priceKrw.max
    ) {
      errors.push(
        `${label} 가격은 0 ~ ${LIMITS.priceKrw.max.toLocaleString('ko-KR')}원 사이의 정수입니다.`
      )
    }
    if (
      !Number.isInteger(v.stock) ||
      v.stock < LIMITS.stock.min ||
      v.stock > LIMITS.stock.max
    ) {
      errors.push(
        `${label} 재고는 0 ~ ${LIMITS.stock.max}개 사이의 정수입니다.`
      )
    }
  })

  // 같은 상품 안에서 옵션 이름은 겹칠 수 없다 (0001 의 unique 제약)
  const names = d.variants.map((v) => v.name.trim()).filter(Boolean)
  if (new Set(names).size !== names.length) {
    errors.push(
      '옵션 이름이 겹칩니다. 한 상품 안에서 이름은 서로 달라야 합니다.'
    )
  }

  return errors
}
