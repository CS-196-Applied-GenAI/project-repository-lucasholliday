import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function BaseIcon({ children, ...props }: IconProps) {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' {...props}>
      {children}
    </svg>
  )
}

export function ThumbUpIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d='M14 10V5a3 3 0 0 0-3-3l-4 9v9h11a2 2 0 0 0 2-1.7l1-7A2 2 0 0 0 19 9h-5Z' />
      <path d='M7 22H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3' />
    </BaseIcon>
  )
}

export function CommentIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d='M21 11.5A8.5 8.5 0 0 1 8.9 19L3 21l2-5.7A8.5 8.5 0 1 1 21 11.5Z' />
    </BaseIcon>
  )
}

export function RepeatIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d='m17 2 4 4-4 4' />
      <path d='M3 11V9a4 4 0 0 1 4-4h14' />
      <path d='m7 22-4-4 4-4' />
      <path d='M21 13v2a4 4 0 0 1-4 4H3' />
    </BaseIcon>
  )
}

export function ShareIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx='18' cy='5' r='3' />
      <circle cx='6' cy='12' r='3' />
      <circle cx='18' cy='19' r='3' />
      <path d='M8.6 13.5 15.4 17.5' />
      <path d='M15.4 6.5 8.6 10.5' />
    </BaseIcon>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d='M3 6h18' />
      <path d='M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2' />
      <path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6' />
      <path d='M10 11v6' />
      <path d='M14 11v6' />
    </BaseIcon>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx='11' cy='11' r='7' />
      <path d='m20 20-3.5-3.5' />
    </BaseIcon>
  )
}
