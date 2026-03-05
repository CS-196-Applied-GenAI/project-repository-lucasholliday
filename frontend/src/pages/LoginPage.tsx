import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError, apiFetch } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { SystemStatusCard } from '../components/SystemStatusCard'
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
      const me = await apiFetch<{ username: string; bio?: string | null; profile_picture?: string | null }>('/auth/me')
      auth.setMe(me)
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
    <main className='mx-auto max-w-md p-6'>
      <Card className='p-6'>
        <h1 className='text-3xl font-semibold text-[var(--text-primary)]'>Login</h1>
        <p className='mt-2 text-sm text-[var(--text-secondary)]'>Welcome back. Sign in to access your feed.</p>
        <form className='mt-6 space-y-4' onSubmit={onSubmit}>
          <TextField
            id='login-username'
            label='Username'
            value={username}
            onChange={(event) => {
              setUsername(event.target.value)
              setError(null)
            }}
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
          />
          {error ? (
            <p role='alert' className='text-sm text-red-300'>
              {error}
            </p>
          ) : null}
          <Button type='submit' variant='primary' disabled={isSubmitting} className='w-full'>
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
        <p className='mt-4 text-sm text-[var(--text-secondary)]'>
          No account yet?{' '}
          <Link to='/register' className='premium-link underline underline-offset-2'>
            Create account
          </Link>
        </p>
        <SystemStatusCard />
      </Card>
    </main>
  )
}
