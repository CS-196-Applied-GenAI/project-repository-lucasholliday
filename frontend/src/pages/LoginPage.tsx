import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { ApiError, apiFetch } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { TextField } from '../ui/TextField'
import { useToast } from '../ui/toast'

export function LoginPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const { pushToast } = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (auth.isAuthenticated) {
    return <Navigate to='/home' replace />
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setError(null)
      const data = await apiFetch<{ token?: string; access_token?: string }>('/auth/login', {
        method: 'POST',
        body: { username, password },
      })

      const token = data.token ?? data.access_token
      if (!token) {
        setError('Login failed')
        return
      }

      auth.login(token)
      try {
        const me = await apiFetch<{ username: string; bio?: string | null; profile_picture?: string | null }>('/auth/me')
        auth.setMe(me)
      } catch {
        // The token is already valid at this point, so let the protected app bootstrap recover.
      }
      pushToast('Signed in successfully', 'success')
      navigate('/home')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid username/password')
        pushToast('Invalid username/password', 'error')
        return
      }
      setError('Login failed')
      pushToast('Login failed', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className='app-grid flex min-h-screen items-center justify-center px-4 py-8'>
      <h1 className='sr-only'>Login</h1>
      <div className='grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]'>
        <Card className='hidden overflow-hidden lg:block'>
          <div className='flex h-full flex-col justify-between bg-[radial-gradient(circle_at_top_left,rgba(74,222,128,0.18),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(34,197,94,0.16),transparent_25%),linear-gradient(180deg,rgba(23,48,36,0.95),rgba(13,27,20,0.98))] p-10'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-300)]'>Grove</p>
              <h1 className='mt-5 max-w-lg text-5xl font-semibold tracking-tight text-[var(--text-primary)]'>
                Find your corner of the conversation.
              </h1>
              <p className='mt-5 max-w-xl text-base leading-8 text-[var(--text-secondary)]'>
                Grove is a calmer social space for campus conversation, local perspective, and the moments worth sharing.
              </p>
            </div>
            <div className='grid gap-4 md:grid-cols-3'>
              {[
                ['Home', 'Follow the latest posts in one place.'],
                ['Private account', 'Sign in securely and pick up where you left off.'],
                ['Profiles', 'See who people are, what they share, and who they follow.'],
              ].map(([title, description]) => (
                <div key={title} className='rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4'>
                  <p className='text-sm font-semibold text-[var(--text-primary)]'>{title}</p>
                  <p className='mt-2 text-sm leading-6 text-[var(--text-secondary)]'>{description}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className='mx-auto w-full max-w-xl p-6 md:p-8'>
          <div className='rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)] p-5'>
            <p className='text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-300)]'>Welcome back</p>
            <h2 className='mt-3 text-4xl font-semibold tracking-tight text-[var(--text-primary)]'>Sign in to Grove</h2>
            <p className='mt-3 text-sm leading-6 text-[var(--text-secondary)]'>Sign in to open Home, Explore, and Profile.</p>
          </div>

          <form className='mt-6 space-y-5' onSubmit={onSubmit}>
            <TextField
              id='login-username'
              label='Username'
              value={username}
              onChange={(event) => {
                setUsername(event.target.value)
                setError(null)
              }}
              placeholder='Enter your username'
            />
            <TextField
              id='login-password'
              label='Password'
              type='password'
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError(null)
              }}
              placeholder='Enter your password'
            />
            {error ? (
              <div role='alert' className='rounded-[var(--radius-md)] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100'>
                {error}
              </div>
            ) : null}
            <Button type='submit' variant='primary' disabled={isSubmitting} className='w-full'>
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className='mt-5 flex items-center justify-between gap-3 text-sm text-[var(--text-secondary)]'>
            <span>New to Grove?</span>
            <Link to='/register' className='premium-link font-semibold underline underline-offset-4'>
              Create account
            </Link>
          </div>
        </Card>
      </div>
    </main>
  )
}
