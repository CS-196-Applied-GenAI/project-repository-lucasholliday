import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { ApiError, apiFetch } from '../api/client'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useToast } from '../ui/toast'

export function UserProfilePage() {
  const { username } = useParams()
  const { pushToast } = useToast()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onToggleFollow() {
    if (!username) return

    const nextFollowing = !isFollowing
    setError(null)

    try {
      if (nextFollowing) {
        await apiFetch(`/users/${username}/follow`, { method: 'POST' })
      } else {
        await apiFetch(`/users/${username}/follow`, { method: 'DELETE' })
      }
      setIsFollowing(nextFollowing)
      pushToast(nextFollowing ? `Following ${username}` : `Unfollowed ${username}`, 'success')
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('User not found')
        pushToast('User not found', 'error')
        return
      }
      if (err instanceof ApiError && err.status === 403) {
        setError('Action not allowed')
        pushToast('Action not allowed', 'error')
        return
      }
      if (err instanceof ApiError && err.status === 400) {
        setError(err.message || 'Bad request')
        pushToast(err.message || 'Bad request', 'error')
        return
      }
      setError('Request failed')
      pushToast('Request failed', 'error')
    }
  }

  async function onToggleBlock() {
    if (!username) return

    const nextBlocked = !isBlocked
    setError(null)

    try {
      if (nextBlocked) {
        await apiFetch(`/users/${username}/block`, { method: 'POST' })
      } else {
        await apiFetch(`/users/${username}/block`, { method: 'DELETE' })
      }
      setIsBlocked(nextBlocked)
      if (nextBlocked) {
        setIsFollowing(false)
      }
      pushToast(nextBlocked ? `Blocked ${username}` : `Unblocked ${username}`, 'success')
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('User not found')
        pushToast('User not found', 'error')
        return
      }
      if (err instanceof ApiError && err.status === 403) {
        setError('Action not allowed')
        pushToast('Action not allowed', 'error')
        return
      }
      setError('Request failed')
      pushToast('Request failed', 'error')
    }
  }

  return (
    <main>
      <h1 className='text-2xl font-semibold text-[var(--text-primary)]'>Profile: {username}</h1>
      <p className='mt-2 text-[var(--text-secondary)]'>Follow to see this user in your home feed.</p>
      <p className='text-sm text-[var(--accent-300)]'>Tweets coming soon</p>

      {isBlocked ? (
        <Card className='mt-4 border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-100'>You blocked this user.</Card>
      ) : null}

      <div className='mt-4 flex flex-wrap gap-2'>
        {!isBlocked ? (
          <Button type='button' size='sm' onClick={onToggleFollow}>
            {isFollowing ? 'Unfollow' : 'Follow'}
          </Button>
        ) : null}

        <Button type='button' variant='danger' size='sm' onClick={onToggleBlock}>
          {isBlocked ? 'Unblock' : 'Block'}
        </Button>
      </div>

      {error ? (
        <p role='alert' className='mt-3 text-sm text-red-300'>
          {error}
        </p>
      ) : null}
    </main>
  )
}
