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
        'inline-flex select-none items-center justify-center rounded-full border border-[var(--border-strong)] bg-[radial-gradient(circle_at_top,#214431,#112219)] text-[var(--accent-200)] shadow-[0_10px_24px_rgba(0,0,0,0.22)]',
        size === 'sm' ? 'h-9 w-9 text-xs font-semibold' : 'h-11 w-11 text-sm font-semibold',
      )}
    >
      {initialsFor(username)}
    </div>
  )
}
