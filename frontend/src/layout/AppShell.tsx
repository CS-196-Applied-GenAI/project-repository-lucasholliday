import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { apiFetch } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { CompassIcon, ExitIcon, FeatherIcon, HomeIcon, SparklesIcon, UserIcon } from '../ui/icons'

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const navItems = [
    { to: '/home', label: 'Home', icon: <HomeIcon width={18} height={18} /> },
    { to: '/discover', label: 'Explore', icon: <CompassIcon width={18} height={18} /> },
    { to: '/profile', label: 'Profile', icon: <UserIcon width={18} height={18} /> },
  ]
  const suggestedUsers = ['wildcatfan', 'northwesterngrad', 'campusreport']
  const trendingTopics = ['Northwestern hoops', 'Lakefill sunset', 'Big Ten tournament']
  const communities = ['Campus Life', 'Chicago Sports', 'Evanston Weekends']
  const baseLinkClass =
    'focus-ring flex w-full items-center gap-3 whitespace-nowrap rounded-[var(--radius-md)] border border-transparent px-3.5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--bg-layer-2)] hover:text-[var(--text-primary)]'

  async function onLogout() {
    try {
      setIsLoggingOut(true)
      await apiFetch('/auth/logout', { method: 'POST' })
    } catch {
      // Best effort only.
    } finally {
      auth.logout()
      navigate('/login')
      setIsLoggingOut(false)
    }
  }

  return (
    <div className='app-grid min-h-screen'>
      <div className='mx-auto grid min-h-screen w-full max-w-[1380px] grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[220px_minmax(0,1fr)_280px] lg:gap-6 lg:px-6 xl:grid-cols-[220px_minmax(0,680px)_300px]'>
        <aside className='lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]'>
          <Card className='flex h-full flex-col p-4'>
            <button
              type='button'
              onClick={() => navigate('/home')}
              className='focus-ring rounded-[var(--radius-md)] p-1 text-left'
            >
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-glow-strong)] text-[var(--accent-300)]'>
                  <SparklesIcon width={20} height={20} />
                </div>
                <div>
                  <p className='text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent-300)]'>Grove</p>
                  <h1 className='mt-1 text-xl font-semibold tracking-tight text-[var(--text-primary)]'>Calmer social.</h1>
                </div>
              </div>
            </button>

            <div className='mt-5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-layer-1)] p-3'>
              <div className='flex items-center gap-3'>
                <Avatar username={auth.me?.username ?? 'grove'} />
                <div className='min-w-0'>
                  <p className='truncate text-sm font-semibold text-[var(--text-primary)]'>{auth.me?.username ?? 'Loading…'}</p>
                  <p className='truncate text-xs text-[var(--text-muted)]'>@{auth.me?.username ?? 'grove'}</p>
                </div>
              </div>
            </div>

            <nav aria-label='Primary' className='mt-5 grid gap-2'>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `${baseLinkClass} ${isActive ? 'border-[var(--border-strong)] bg-[var(--bg-layer-1)] text-[var(--text-primary)]' : ''}`
                  }
                >
                  <span className='text-[var(--accent-300)]'>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className='mt-5'>
              <Button type='button' variant='primary' className='w-full gap-2' onClick={() => navigate('/compose')}>
                <FeatherIcon width={17} height={17} />
                Post
              </Button>
            </div>

            <div className='mt-auto space-y-4 pt-5'>
              <button
                type='button'
                disabled={isLoggingOut}
                onClick={onLogout}
                className={`${baseLinkClass} border-[var(--border-subtle)] bg-[var(--bg-layer-2)] text-left disabled:opacity-60`}
              >
                <span className='text-red-200'>
                  <ExitIcon width={18} height={18} />
                </span>
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>
          </Card>
        </aside>

        <section className='min-w-0 md:p-1'>
          <div className='mb-5 flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-300)]'>Grove</p>
              <p className='mt-2 text-sm text-[var(--text-secondary)]'>
                {location.pathname === '/home'
                  ? 'Your personalized feed'
                  : location.pathname === '/discover'
                    ? 'Explore profiles and communities'
                    : location.pathname === '/profile'
                      ? 'Manage your profile'
                      : 'Stay in the conversation'}
              </p>
            </div>
            <Button type='button' variant='ghost' size='sm' onClick={() => navigate('/home')}>
              Back
            </Button>
          </div>
          <Outlet />
        </section>

        <aside className='hidden lg:block'>
          <div className='sticky top-5 space-y-4'>
            <Card className='p-5'>
              <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-300)]'>Trending</p>
              <ul className='mt-4 space-y-3'>
                {trendingTopics.map((topic) => (
                  <li key={topic} className='border-b border-[var(--border-subtle)] pb-3 last:border-b-0 last:pb-0'>
                    <p className='text-sm font-medium text-[var(--text-primary)]'>{topic}</p>
                    <p className='mt-1 text-xs text-[var(--text-muted)]'>Active conversation</p>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className='p-5'>
              <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-300)]'>Communities</p>
              <ul className='mt-4 space-y-3 text-sm text-[var(--text-secondary)]'>
                {communities.map((community) => (
                  <li key={community} className='rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-3 py-3'>
                    {community}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className='p-5'>
              <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-300)]'>Suggested users</p>
              <div className='mt-4 space-y-3'>
                {suggestedUsers.map((username) => (
                  <button
                    key={username}
                    type='button'
                    onClick={() => navigate(`/u/${username}`)}
                    className='focus-ring flex w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-3 py-3 text-left transition hover:border-[var(--accent-500)]'
                  >
                    <div>
                      <p className='text-sm font-medium text-[var(--text-primary)]'>@{username}</p>
                      <p className='mt-1 text-xs text-[var(--text-muted)]'>Profile</p>
                    </div>
                    <span className='text-xs font-semibold text-[var(--accent-300)]'>Open</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  )
}
