const BUCKET = 'product-images'

/**
 * 상품 사진 주소를 만든다.
 *
 * DB의 `images[]`에는 **저장소 안의 경로만** 넣는다 (`키링/01.jpg`).
 * 전체 주소를 넣지 않는 이유는, 그러면 프로젝트가 바뀔 때 **모든 행을
 * 고쳐야** 하기 때문이다. 경로만 두면 이 파일 한 줄로 끝난다.
 *
 * 다만 지금은 레포 안의 사진(`/photos/...`)도 섞여 있다. 그래서
 * **이미 완성된 주소는 그대로 통과시킨다** — 옮기는 동안 둘이 공존한다.
 *
 * ```
 * imageUrl('키링/01.jpg')      → https://<project>.supabase.co/storage/.../키링/01.jpg
 * imageUrl('/photos/a.jpg')    → /photos/a.jpg        (그대로)
 * imageUrl('https://x/y.jpg')  → https://x/y.jpg      (그대로)
 * ```
 */
export function imageUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return ''

  // 이미 주소인 것은 건드리지 않는다
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  // 레포 안의 사진 (public/ 기준 절대경로)
  if (pathOrUrl.startsWith('/')) return pathOrUrl

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return ''

  // 한글 폴더·파일명이 들어올 수 있어 조각마다 인코딩한다.
  // 통째로 encodeURI 하면 이미 인코딩된 것이 두 번 인코딩된다.
  const encoded = pathOrUrl.split('/').map(encodeURIComponent).join('/')
  return `${base}/storage/v1/object/public/${BUCKET}/${encoded}`
}
