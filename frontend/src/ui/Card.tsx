import type { ComponentPropsWithoutRef, ElementType } from 'react'

import { cn } from './cn'

type CardProps<T extends ElementType> = {
  as?: T
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>

export function Card<T extends ElementType = 'div'>({ as, className, ...props }: CardProps<T>) {
  const Component = as ?? 'div'
  return <Component {...props} className={cn('surface', className)} />
}
