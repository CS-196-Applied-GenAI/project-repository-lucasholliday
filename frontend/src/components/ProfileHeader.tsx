import type { ReactNode } from 'react'

import { Avatar } from '../ui/Avatar'
import { Card } from '../ui/Card'

type ProfileHeaderProps = {
  username: string
  bio?: string | null
  followerCount?: number
  followingCount?: number
  actions?: ReactNode
  profilePicture?: string | null
  isOwnProfile?: boolean
}

export function ProfileHeader({
  username,
  bio,
  followerCount = 0,
  followingCount = 0,
  actions,
  profilePicture,
  isOwnProfile = false,
}: ProfileHeaderProps) {
  return (
    <Card className='overflow-hidden p-0'>
      <div className='h-32 bg-[radial-gradient(circle_at_top_left,rgba(74,222,128,0.26),transparent_38%),linear-gradient(135deg,rgba(23,48,36,0.98),rgba(10,22,16,0.94))]' />
      <div className='px-5 pb-5'>
        <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
          <div className='-mt-8 flex items-end gap-4'>
            {profilePicture ? (
              <img
                src={profilePicture}
                alt={`${username} profile`}
                className='h-20 w-20 rounded-3xl border border-[var(--border-strong)] object-cover shadow-[var(--shadow-soft)]'
              />
            ) : (
              <div className='-mt-1'>
                <Avatar username={username} />
              </div>
            )}
            <div>
              <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-300)]'>
                {isOwnProfile ? 'Your profile' : 'Profile'}
              </p>
              <h1 className='mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)]'>@{username}</h1>
              <p className='mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]'>
                {bio?.trim() ? bio : 'No bio yet.'}
              </p>
            </div>
          </div>
          {actions ? <div className='flex flex-wrap gap-2'>{actions}</div> : null}
        </div>
        <div className='mt-5 flex flex-wrap gap-3'>
          <div className='rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--text-secondary)]'>
            <span className='font-semibold text-[var(--text-primary)]'>{followerCount}</span> followers
          </div>
          <div className='rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--text-secondary)]'>
            <span className='font-semibold text-[var(--text-primary)]'>{followingCount}</span> following
          </div>
        </div>
      </div>
    </Card>
  )
}
