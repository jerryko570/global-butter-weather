'use client'

/**
 * 올리기 전에 사진을 줄인다. **브라우저에서 한다** — 서버로 원본을 보내고
 * 거기서 줄이면 느린 구간(업로드)을 그대로 통과하게 된다.
 *
 * 폰으로 찍은 사진은 4000px, 5MB 를 넘는다. 화면에서 가장 크게 쓰이는
 * 자리가 상세의 정사각 사진이고 그마저 1000px 이 안 된다. **원본을 그대로
 * 두면 저장 공간과 손님의 데이터를 둘 다 낭비한다.**
 *
 * `next/image` 가 어차피 크기별로 다시 만들지만, 그것은 **받은 뒤의**
 * 이야기다. 올리는 시간은 줄여주지 않는다.
 */

/** 긴 변 기준. 상세의 정사각 사진이 2배 화면에서 약 1170px 이라 여유를 둔다 */
const MAX_EDGE = 1600

/** 0.82 는 눈으로 차이를 못 느끼면서 용량이 크게 줄어드는 지점이다 */
const QUALITY = 0.82

/**
 * 줄인 파일을 돌려준다. **줄일 수 없으면 원본을 그대로 돌려준다** —
 * 여기서 실패해도 업로드 자체는 되어야 한다.
 *
 * PNG·GIF 도 JPEG 로 바꾼다. 상품 사진에 투명도가 필요한 경우가 없고,
 * 같은 화질에서 JPEG 가 훨씬 작다.
 */
export async function compressImage(file: File): Promise<File> {
  // 이미 충분히 작으면 건드리지 않는다. 다시 굽는 것 자체가 손실이다
  if (file.size < 300 * 1024) return file
  if (!file.type.startsWith('image/')) return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)

    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY)
    )
    if (!blob) return file

    // 줄였는데 더 커졌다면 원본이 낫다. 작은 사진에서 가끔 일어난다
    if (blob.size >= file.size) return file

    const base = file.name.replace(/\.[^.]+$/, '')
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg' })
  } catch {
    // 브라우저가 못 읽는 형식일 수 있다. 원본으로 올린다
    return file
  }
}

/** 사람이 읽는 크기. 줄어든 것을 보여줄 때 쓴다 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}
