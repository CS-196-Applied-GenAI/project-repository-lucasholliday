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
        'focus-ring rounded-[var(--radius-md)] border font-semibold transition duration-150 disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5 text-sm',
        variant === 'primary' &&
          'border-[var(--accent-400)] bg-[color:var(--accent-500)]/15 text-[var(--accent-200)] hover:bg-[color:var(--accent-500)]/22',
        variant === 'secondary' &&
          'border-[var(--border-strong)] bg-[color:var(--bg-layer-3)]/60 text-[var(--text-primary)] hover:border-[var(--accent-500)] hover:bg-[color:var(--accent-500)]/10',
        variant === 'ghost' && 'border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-white/5 hover:text-white',
        variant === 'danger' &&
          'border-red-500/60 bg-red-500/10 text-red-200 hover:bg-red-500/18 hover:border-red-400/80',
        className,
      )}
    />
  )
}
