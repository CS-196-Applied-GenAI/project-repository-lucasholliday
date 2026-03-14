import { Card } from '../ui/Card'

type LoadingSkeletonProps = {
  count?: number
  compact?: boolean
}

export function LoadingSkeleton({ count = 3, compact = false }: LoadingSkeletonProps) {
  return (
    <div aria-label='Loading' className='space-y-3'>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className='animate-pulse p-4 md:p-5'>
          <div className='flex items-center gap-3'>
            <div className='h-11 w-11 rounded-full bg-[color:var(--bg-layer-3)]' />
            <div className='flex-1 space-y-2'>
              <div className='h-3 w-28 rounded-full bg-[color:var(--bg-layer-3)]' />
              <div className='h-2.5 w-20 rounded-full bg-[color:var(--bg-layer-3)]/75' />
            </div>
          </div>
          <div className='mt-4 h-3 w-full rounded-full bg-[color:var(--bg-layer-3)]/90' />
          <div className='mt-2 h-3 rounded-full bg-[color:var(--bg-layer-3)]/72' />
          {!compact ? <div className='mt-5 h-10 rounded-2xl bg-[color:var(--bg-layer-3)]/68' /> : null}
        </Card>
      ))}
    </div>
  )
}
