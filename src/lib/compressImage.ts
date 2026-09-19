'use client'

/**
 * 올리기 전에 사진을 **웹이 읽을 수 있는 형식으로, 작게** 만든다.
 * 브라우저에서 한다 — 서버로 원본을 보내면 느린 구간(업로드)을 그대로
 * 통과하게 된다.
 *
 * 두 가지를 동시에 푼다.
 *
 * 1. **용량.** 폰 사진은 4000px, 5MB 를 넘는데 화면에서 가장 큰 자리가
 *    1000px 이 안 된다. `next/image` 가 크기별로 다시 만들어 주지만 그건
 *    **받은 뒤**의 이야기라 올리는 시간은 줄여주지 않는다.
 *
 * 2. **형식.** HEIC·TIFF·BMP 는 브라우저가 `<img>` 로 못 그린다. 그대로
 *    올리면 저장은 되는데 화면에 **엑스박스**가 뜬다 (2026-09-19에 실제로
 *    그랬다). 그래서 **읽을 수 있는 것은 전부 JPEG 로 바꿔서** 올린다.
 *
 * 읽지도 못하는 파일은 **올리지 않고 막는다.** 올려 두고 깨져 보이는 것보다
 * 왜 안 되는지 말해주는 편이 낫다.
 */

/** 긴 변 기준. 상세의 정사각 사진이 2배 화면에서 약 1170px 이라 여유를 둔다 */
const MAX_EDGE = 1600

/** 0.82 는 눈으로 차이를 못 느끼면서 용량이 크게 주는 지점이다 */
const QUALITY = 0.82

/**
 * 손대지 않고 그냥 올려도 되는 형식·크기.
 * 작은 파일을 다시 굽는 것은 손실만 남는다.
 */
const WEB_SAFE = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const SMALL_ENOUGH = 300 * 1024

export type CompressResult =
  | { ok: true; file: File }
  | { ok: false; name: string; reason: string }

/**
 * 브라우저가 이 파일을 실제로 그릴 수 있는지 **시도해서** 확인한다.
 * 확장자를 믿지 않는다 — 이름만 `.jpg` 인 HEIC 가 흔하다.
 *
 * `createImageBitmap` 이 먼저다. 그것이 거절하는 형식을 `<img>` 가 읽는
 * 경우가 있어(브라우저마다 다르다) 한 번 더 시도한다.
 */
async function decode(
  file: File
): Promise<ImageBitmap | HTMLImageElement | null> {
  try {
    return await createImageBitmap(file)
  } catch {
    // 아래로
  }

  const url = URL.createObjectURL(file)
  try {
    const img = new window.Image()
    img.src = url
    await img.decode()
    return img
  } catch {
    return null
  } finally {
    // 그린 뒤에 풀면 늦다. canvas 에 옮겨 담는 것은 decode 이후라 안전하다
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }
}

function sizeOf(src: ImageBitmap | HTMLImageElement) {
  return src instanceof window.HTMLImageElement
    ? { w: src.naturalWidth, h: src.naturalHeight }
    : { w: src.width, h: src.height }
}

/**
 * 한 장을 처리한다. 줄일 수 없거나 줄일 필요가 없으면 **원본을 그대로**
 * 돌려주되, **웹이 못 읽는 형식이면 실패로 돌려준다.**
 */
export async function compressImage(file: File): Promise<CompressResult> {
  const webSafe = WEB_SAFE.has(file.type)

  // 이미 작고 웹이 읽는 형식이면 손대지 않는다
  if (webSafe && file.size < SMALL_ENOUGH) return { ok: true, file }

  const src = await decode(file)
  if (!src) {
    return {
      ok: false,
      name: file.name,
      reason: webSafe
        ? '파일이 손상되었거나 사진이 아닙니다.'
        : '이 브라우저가 못 읽는 형식입니다. JPEG·PNG 로 바꿔서 올려 주세요.',
    }
  }

  try {
    const { w, h } = sizeOf(src)
    const scale = Math.min(1, MAX_EDGE / Math.max(w, h))

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)

    const ctx = canvas.getContext('2d')
    if (!ctx) return { ok: true, file }
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY)
    )
    if (!blob) return { ok: true, file }

    // 줄였는데 더 커졌다면 원본이 낫다 — 단 **웹이 읽는 형식일 때만** 그렇다.
    // HEIC 는 아무리 작아도 그대로 두면 엑스박스가 된다
    if (webSafe && blob.size >= file.size) return { ok: true, file }

    const base = file.name.replace(/\.[^.]+$/, '') || 'photo'
    return {
      ok: true,
      file: new File([blob], `${base}.jpg`, { type: 'image/jpeg' }),
    }
  } finally {
    if (!(src instanceof window.HTMLImageElement)) src.close()
  }
}

/** 사람이 읽는 크기. 줄어든 것을 보여줄 때 쓴다 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}
