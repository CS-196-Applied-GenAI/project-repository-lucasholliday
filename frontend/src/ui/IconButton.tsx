import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from './cn'

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: ReactNode
  count?: number
  active?: boolean
}

export function IconButton({ className, icon, count, active = false, ...props }: IconButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'focus-ring inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-sm transition duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60',
        active
          ? 'border-[var(--accent-400)] bg-[var(--accent-glow)] text-[var(--accent-200)]'
          : 'border-[var(--border-subtle)] bg-[color:var(--bg-layer-3)]/45 text-[var(--text-secondary)] hover:border-[var(--accent-500)] hover:text-[var(--accent-300)]',
        className,
      )}
    >
      <span aria-hidden='true' className={cn(active && 'like-pop')}>
        {icon}
      </span>
      {typeof count === 'number' ? <span className='min-w-4 text-xs font-semibold'>{count}</span> : null}
    </button>
  )
}
