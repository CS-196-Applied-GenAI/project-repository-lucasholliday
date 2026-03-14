import type { InputHTMLAttributes } from 'react'

import { cn } from './cn'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

export function TextField({ id, label, className, ...props }: TextFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className='text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-300)]'
      >
        {label}
      </label>
      <input
        id={id}
        {...props}
        className={cn(
          'focus-ring mt-2 w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[color:var(--bg-layer-3)]/60 px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition duration-200 hover:border-[var(--accent-500)]',
          className,
        )}
      />
    </div>
  )
}
