'use client'

import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'theme'
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return document.documentElement.classList.contains('dark')
}

// 서버는 localStorage를 모른다. 항상 라이트로 그린다 — layout.tsx의 head
// 스크립트가 실제 값을 hydration 전에 이미 DOM에 반영해 두었으므로,
// useSyncExternalStore가 hydration 직후 getSnapshot을 다시 읽어 스스로
// 맞는 값으로 고친다. 이것이 서버·클라이언트 값이 다른 경우를 위해
// React가 공식으로 두는 방법이라 useEffect로 손수 동기화하지 않는다.
function getServerSnapshot() {
  return false
}

function setTheme(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark)
  try {
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light')
  } catch {
    // localStorage 접근 불가(프라이빗 모드 등) — 이번 세션에서만 적용된다
  }
  listeners.forEach((listener) => listener())
}

/**
 * 다크모드 수동 토글. OS 설정을 따라가지 않는다 (CLAUDE.md 4절) —
 * 그래서 이 버튼 없이는 다크모드에 들어갈 방법이 없다.
 */
export default function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return (
    <button
      type="button"
      onClick={() => setTheme(!isDark)}
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className="text-ink-muted hover:text-ink flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
      style={{ transitionDuration: 'var(--duration-fast)' }}
    >
      {isDark ? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )}
    </button>
  )
}
