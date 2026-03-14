import { useContext, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { ApiError, apiFetch } from '../api/client'
import { AuthContext } from '../auth/AuthContext'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { TextField } from '../ui/TextField'
import { useToast } from '../ui/toast'

export function RegisterPage() {
  const navigate = useNavigate()
  const auth = useContext(AuthContext)
  const { pushToast } = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (auth?.isAuthenticated) {
    return <Navigate to='/home' replace />
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (confirmPassword !== password) {
      setSuccess(null)
      setError('Passwords do not match')
      pushToast('Passwords do not match', 'error')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await apiFetch('/auth/register', {
        method: 'POST',
        body: { username, password },
      })
      setSuccess('Account created')
      pushToast('Account created. Please sign in.', 'success')
      navigate('/login')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('Username already taken')
        pushToast('Username already taken', 'error')
        return
      }
      setError('Registration failed')
      pushToast('Registration failed', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className='app-grid flex min-h-screen items-center justify-center px-4 py-8'>
      <h1 className='sr-only'>Create Account</h1>
      <div className='grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]'>
        <Card className='mx-auto w-full max-w-xl p-6 md:p-8'>
          <div className='rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)] p-5'>
            <p className='text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-300)]'>Create account</p>
            <h1 className='mt-3 text-4xl font-semibold tracking-tight text-[var(--text-primary)]'>Join Grove</h1>
            <p className='mt-3 text-sm leading-6 text-[var(--text-secondary)]'>
              Create a profile and start sharing posts.
            </p>
          </div>

          <form className='mt-6 space-y-5' onSubmit={onSubmit}>
            <TextField
              id='register-username'
              label='Username'
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder='Choose a username'
            />
            <TextField
              id='register-password'
              label='Password'
              type='password'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder='Create a strong password'
            />
            <p className='rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm text-[var(--text-secondary)]'>
              Password rules: 8+ chars, uppercase, lowercase, and a digit.
            </p>
            <TextField
              id='register-confirm-password'
              label='Confirm Password'
              type='password'
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder='Re-enter your password'
            />
            {error ? (
              <div role='alert' className='rounded-[var(--radius-md)] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100'>
                {error}
              </div>
            ) : null}
            {success ? (
              <div className='rounded-[var(--radius-md)] border border-[var(--accent-500)]/40 bg-[var(--accent-glow)] px-4 py-3 text-sm text-[var(--accent-200)]'>
                {success}
              </div>
            ) : null}
            <Button type='submit' variant='primary' className='w-full' disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className='mt-5 flex items-center justify-between gap-3 text-sm text-[var(--text-secondary)]'>
            <span>Already have an account?</span>
            <Link to='/login' className='premium-link font-semibold underline underline-offset-4'>
              Back to login
            </Link>
          </div>
        </Card>

        <Card className='hidden overflow-hidden lg:block'>
          <div className='flex h-full flex-col justify-between bg-[radial-gradient(circle_at_top_right,rgba(74,222,128,0.18),transparent_34%),radial-gradient(circle_at_20%_80%,rgba(34,197,94,0.14),transparent_28%),linear-gradient(180deg,rgba(23,48,36,0.95),rgba(13,27,20,0.98))] p-10'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-300)]'>Product Preview</p>
              <h2 className='mt-5 max-w-lg text-5xl font-semibold tracking-tight text-[var(--text-primary)]'>A calmer way to keep up.</h2>
              <p className='mt-5 max-w-xl text-base leading-8 text-[var(--text-secondary)]'>
                Join Grove to follow campus conversation, neighborhood updates, and the people shaping your timeline.
              </p>
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              {[
                ['Green premium UI', 'Dark, modern surfaces with restrained accent color and stronger spacing.'],
                ['Private account flow', 'Move from sign up to sign in without losing your place.'],
                ['Home-first experience', 'Post, browse, and interact from a refined 3-column shell.'],
                ['Profile actions', 'Follow, unfollow, block, and edit profile in a single place.'],
              ].map(([title, description]) => (
                <div key={title} className='rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4'>
                  <p className='text-sm font-semibold text-[var(--text-primary)]'>{title}</p>
                  <p className='mt-2 text-sm leading-6 text-[var(--text-secondary)]'>{description}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
