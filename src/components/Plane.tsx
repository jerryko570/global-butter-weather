/**
 * 일러스트 면. **통째로 놓고 확대해 잘라낸다** (foundation.md 5-11절).
 * 모티프만 떼어 다른 바탕에 올리지 않는다 — 배경까지가 한 장의 그림이다.
 */
export default function Plane({ src, zoom }: { src: string; zoom: number }) {
  return (
    <div
      className="h-full w-full"
      style={{
        backgroundImage: `url(/illustrations/${src}.svg)`,
        backgroundSize: `${zoom}% auto`,
        backgroundPosition: 'center',
      }}
      aria-hidden
    />
  )
}
