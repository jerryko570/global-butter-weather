'use client'

import { createContext, useCallback, useContext, useState } from 'react'

/**
 * 알림 띠. **무언가 실제로 바뀐 뒤에만 띄운다** — 저장·삭제처럼 데이터가
 * 움직였을 때다. 화면만 옮겼을 때는 띄우지 않는다.
 *
 * 라이브러리를 쓰지 않는다. 필요한 것이 「글 한 줄을 몇 초 띄운다」뿐이라
 * 의존성을 늘릴 이유가 없다.
 *
 * 계승한 디자인대로 **모서리를 두지 않고 얇은 테두리**만 쓴다. 그림자·
 * 둥근 모서리를 넣으면 이 화면에서 혼자 떠 보인다.
 */

type Tone = 'done' | 'fail'
type Toast = { id: number; text: string; tone: Tone }

const ToastContext = createContext<{
  show: (text: string, tone?: Tone) => void
} | null>(null)

/** 3.5초. 한 문장을 읽고 눈을 떼기에 충분하고, 다음 일을 막지 않는다 */
const LIFETIME = 3500

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((text: string, tone: Tone = 'done') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, text, tone }])
    window.setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      LIFETIME
    )
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/*
        aria-live: 화면을 보지 않는 사람에게도 읽힌다. 알림은 초점을
        빼앗지 않아야 하므로 polite 다.
      */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <p
            key={t.id}
            className={`text-caption border px-5 py-3 ${
              t.tone === 'fail'
                ? 'border-red-200 bg-red-50 text-red-600'
                : 'border-ink bg-ink text-cloud'
            }`}
          >
            {t.text}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/**
 * `show('저장했습니다')` 처럼 쓴다.
 *
 * Provider 밖에서 부르면 **조용히 아무 일도 안 한다.** 알림이 안 떴다고
 * 저장을 막을 이유는 없다.
 */
export function useToast() {
  const ctx = useContext(ToastContext)
  return ctx ?? { show: () => {} }
}
