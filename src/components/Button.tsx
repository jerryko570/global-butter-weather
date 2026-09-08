import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

/**
 * variant는 5-8절 「틀과 알맹이」를 그대로 옮긴 것이다.
 *
 * - primary: 유일하게 butter를 배경으로 쓴다. 화면에 하나만 두는 것을
 *   전제로 한다(tokens.md 2-3절 "한 화면에 포인트는 원칙적으로 하나").
 *   여러 개 필요해 보이면 정말 다 강조해야 하는지 먼저 되물을 것.
 * - secondary: 틀에 해당한다. 테두리만 있고 배경은 비어 있다.
 * - ghost: secondary보다 더 조용하다. 목록 안의 보조 동작 등.
 *
 * hover 배경은 tokens.md 2-2절의 hover:bg-gray-100을 그대로 쓴다.
 * transition-duration은 tokens.md 5절의 --duration-fast(hover 반응용).
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:pointer-events-none disabled:text-ink-subtle disabled:opacity-60',
  {
    variants: {
      variant: {
        // butter-dark: hover/active에 밝기만 다른 butter를 쓰라는
        // tokens.md 2-3절 규칙 그대로.
        primary: 'bg-butter text-ink-on-accent hover:bg-butter-dark',
        secondary: 'border border-gray-300 text-ink hover:bg-gray-100',
        ghost: 'text-ink-muted hover:bg-gray-100 hover:text-ink',
      },
      size: {
        // 두 size 모두 text-body를 쓴다. 버튼 크기는 높이·좌우 여백으로
        // 구분하고 글자 크기는 건드리지 않는다 — 글자가 작아지면 읽기가
        // 나빠지는데 버튼은 누르라고 있는 것이라 그쪽을 희생하지 않는다.
        md: 'h-10 px-5 text-body',
        sm: 'h-9 px-4 text-body',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants>

export default function Button({
  className,
  variant,
  size,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      style={{ transitionDuration: 'var(--duration-fast)' }}
      {...props}
    />
  )
}
