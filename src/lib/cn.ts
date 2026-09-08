import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * class 조합 유틸. clsx로 조건부 class를 걸러내고 twMerge로 충돌하는
 * Tailwind class(예: `p-2 p-4`)를 뒤엣것이 이기게 정리한다.
 * variant 기반 component(Button 등)가 className prop을 받아
 * 기본 variant style을 덮어써야 할 때 필요하다.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
