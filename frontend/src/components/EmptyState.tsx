import type { ReactNode } from 'react'

import { Card } from '../ui/Card'

type EmptyStateProps = {
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ eyebrow, title, description, action }: EmptyStateProps) {
  return (
    <Card className='p-6 text-center md:p-8'>
      {eyebrow ? (
        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-300)]'>{eyebrow}</p>
      ) : null}
      <h2 className='mt-3 text-xl font-semibold text-[var(--text-primary)]'>{title}</h2>
      <p className='mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]'>{description}</p>
      {action ? <div className='mt-5 flex justify-center'>{action}</div> : null}
    </Card>
  )
}
