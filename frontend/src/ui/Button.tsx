import type { ButtonHTMLAttributes } from 'react'

import { cn } from './cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ className, variant = 'secondary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'focus-ring inline-flex items-center justify-center rounded-[var(--radius-md)] border font-semibold tracking-[0.01em] transition duration-150 disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' ? 'px-3.5 py-2 text-sm' : 'px-4.5 py-2.5 text-sm',
        variant === 'primary' &&
          'border-[var(--accent-500)] bg-[var(--accent-500)] text-[#082313] hover:border-[var(--accent-400)] hover:bg-[var(--accent-400)]',
        variant === 'secondary' &&
          'border-[var(--border-strong)] bg-[var(--bg-layer-2)] text-[var(--text-primary)] hover:border-[var(--accent-500)] hover:text-[var(--accent-200)]',
        variant === 'ghost' &&
          'border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-layer-2)] hover:text-[var(--text-primary)]',
        variant === 'danger' &&
          'border-red-500/40 bg-transparent text-red-200 hover:border-red-400/70 hover:bg-red-500/10',
        className,
      )}
    />
  )
}
