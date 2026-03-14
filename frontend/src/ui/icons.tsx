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

export function HomeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d='M3 11.5 12 4l9 7.5' />
      <path d='M5 10.5V20h14v-9.5' />
      <path d='M9 20v-5h6v5' />
    </BaseIcon>
  )
}

export function CompassIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx='12' cy='12' r='9' />
      <path d='m15.5 8.5-2.5 7-7 2.5 2.5-7 7-2.5Z' />
    </BaseIcon>
  )
}

export function UserIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d='M19 21a7 7 0 0 0-14 0' />
      <circle cx='12' cy='8' r='4' />
    </BaseIcon>
  )
}

export function FeatherIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d='M20.2 3.8a7.5 7.5 0 0 0-10.6 0L4 9.4V20h10.6l5.6-5.6a7.5 7.5 0 0 0 0-10.6Z' />
      <path d='m8 16 8-8' />
      <path d='m10 18 6-6' />
    </BaseIcon>
  )
}

export function ExitIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
      <path d='m16 17 5-5-5-5' />
      <path d='M21 12H9' />
    </BaseIcon>
  )
}

export function SparklesIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d='m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z' />
      <path d='m5 16 .9 2.1L8 19l-2.1.9L5 22l-.9-2.1L2 19l2.1-.9L5 16Z' />
      <path d='m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z' />
    </BaseIcon>
  )
}
