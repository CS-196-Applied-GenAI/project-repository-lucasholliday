import type { InputHTMLAttributes } from 'react'

import { cn } from './cn'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

export function TextField({ id, label, className, ...props }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className='text-sm font-medium text-[var(--text-primary)]'>
        {label}
      </label>
      <input
        id={id}
        {...props}
        className={cn(
          'focus-ring mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[color:var(--bg-layer-3)]/70 px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
          className,
        )}
      />
    </div>
  )
}
