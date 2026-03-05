import { cn } from './cn'

type AvatarProps = {
  username: string
  size?: 'sm' | 'md'
}

function initialsFor(username: string) {
  const cleaned = username.replace(/[^a-zA-Z0-9]/g, '')
  if (!cleaned) return '?'
  return cleaned.slice(0, 2).toUpperCase()
}

export function Avatar({ username, size = 'md' }: AvatarProps) {
  return (
    <div
      aria-hidden='true'
      className={cn(
        'inline-flex select-none items-center justify-center rounded-full border border-[var(--border-strong)] bg-[color:var(--bg-layer-3)] text-[var(--accent-300)]',
        size === 'sm' ? 'h-8 w-8 text-xs font-semibold' : 'h-10 w-10 text-sm font-semibold',
      )}
    >
      {initialsFor(username)}
    </div>
  )
}
