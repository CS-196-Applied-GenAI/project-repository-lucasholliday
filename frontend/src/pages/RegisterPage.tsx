import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError, apiFetch } from '../api/client'
import { SystemStatusCard } from '../components/SystemStatusCard'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { TextField } from '../ui/TextField'
import { useToast } from '../ui/toast'

export function RegisterPage() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (confirmPassword !== password) {
      setSuccess(null)
      setError('Passwords do not match')
      pushToast('Passwords do not match', 'error')
      return
    }

    try {
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
    }
  }

  return (
    <main className='mx-auto max-w-md p-6'>
      <Card className='p-6'>
        <h1 className='text-3xl font-semibold text-[var(--text-primary)]'>Create Account</h1>
        <p className='mt-2 text-sm text-[var(--text-secondary)]'>Join Chirper and build your network.</p>
        <form className='mt-6 space-y-4' onSubmit={onSubmit}>
          <TextField
            id='register-username'
            label='Username'
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <TextField
            id='register-password'
            label='Password'
            type='password'
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <p className='text-sm text-[var(--accent-300)]'>Password rules: 8+ chars, uppercase, lowercase, and a digit.</p>
          <TextField
            id='register-confirm-password'
            label='Confirm Password'
            type='password'
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          {error ? (
            <p role='alert' className='text-sm text-red-300'>
              {error}
            </p>
          ) : null}
          {success ? <p className='text-sm text-[var(--accent-300)]'>{success}</p> : null}
          <Button type='submit' variant='primary' className='w-full'>
            Create Account
          </Button>
        </form>
        <p className='mt-4 text-sm text-[var(--text-secondary)]'>
          <Link to='/login' className='premium-link underline underline-offset-2'>
            Back to login
          </Link>
        </p>
        <SystemStatusCard />
      </Card>
    </main>
  )
}
