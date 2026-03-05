import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { apiFetch } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { DemoModePanel } from '../components/DemoModePanel'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

export function AppShell() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const baseLinkClass =
    'focus-ring block w-full whitespace-nowrap rounded-xl border border-transparent px-4 py-3 text-sm font-semibold tracking-wide text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--accent-glow)] hover:text-[var(--text-primary)]'

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

  function onDemoSeeded() {
    window.dispatchEvent(new Event('chirper:demo-seeded'))
  }

  return (
    <div className='mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-4 px-4 py-5 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_300px] lg:gap-6'>
      <aside className='sticky top-4 h-fit'>
        <Card className='p-4'>
          <div className='mb-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--accent-glow)] p-4'>
            <p className='text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-300)]'>Chirper</p>
            <p className='mt-2 text-sm text-[var(--text-secondary)]'>Greenline social dashboard</p>
            {auth.me ? (
              <div className='mt-3 flex items-center gap-2'>
                <Avatar username={auth.me.username} size='sm' />
                <p className='text-sm font-semibold text-[var(--text-primary)]'>@{auth.me.username}</p>
              </div>
            ) : null}
          </div>

          <p className='mb-2 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-300)]'>Navigation</p>
          <nav aria-label='Primary' className='grid gap-2'>
            <NavLink
              to='/home'
              className={({ isActive }) =>
                `${baseLinkClass} ${isActive ? 'border-[var(--accent-400)] bg-[var(--accent-glow)] text-[var(--text-primary)]' : ''}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to='/compose'
              className={({ isActive }) =>
                `${baseLinkClass} ${isActive ? 'border-[var(--accent-400)] bg-[var(--accent-glow)] text-[var(--text-primary)]' : ''}`
              }
            >
              Compose
            </NavLink>
            <NavLink
              to='/discover'
              className={({ isActive }) =>
                `${baseLinkClass} ${isActive ? 'border-[var(--accent-400)] bg-[var(--accent-glow)] text-[var(--text-primary)]' : ''}`
              }
            >
              Discover
            </NavLink>
            <NavLink
              to='/profile'
              className={({ isActive }) =>
                `${baseLinkClass} ${isActive ? 'border-[var(--accent-400)] bg-[var(--accent-glow)] text-[var(--text-primary)]' : ''}`
              }
            >
              My Profile
            </NavLink>
            <button
              type='button'
              disabled={isLoggingOut}
              onClick={onLogout}
              className={`${baseLinkClass} text-left disabled:opacity-60`}
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </nav>

          <DemoModePanel onSeeded={onDemoSeeded} />
        </Card>
      </aside>
      <section className='min-w-0 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[color:var(--bg-layer-2)]/80 p-5 shadow-[var(--shadow-elevated)] md:p-7'>
        <Outlet />
      </section>
      <aside className='hidden xl:block'>
        <Card className='sticky top-4 space-y-4 p-4'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-300)]'>Who to follow</p>
            <ul className='mt-3 space-y-3'>
              {['demoaccount', 'greenline', 'campusnews'].map((username) => (
                <li key={username} className='flex items-center justify-between gap-2'>
                  <button
                    type='button'
                    className='focus-ring inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-[var(--text-primary)] hover:bg-white/5'
                    onClick={() => navigate(`/u/${username}`)}
                  >
                    <Avatar username={username} size='sm' />
                    <span>@{username}</span>
                  </button>
                  <Button
                    size='sm'
                    onClick={() => {
                      navigate(`/u/${username}`)
                    }}
                  >
                    View
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </aside>
    </div>
  )
}
