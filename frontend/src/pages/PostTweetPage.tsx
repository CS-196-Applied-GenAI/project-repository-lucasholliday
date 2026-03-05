import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { ApiError, apiFetch } from '../api/client'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useToast } from '../ui/toast'

const MAX_TWEET_LENGTH = 240

export function PostTweetPage() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isTooLong = text.length > MAX_TWEET_LENGTH
  const canSubmit = useMemo(() => text.length > 0 && !isTooLong, [text.length, isTooLong])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    try {
      setIsSubmitting(true)
      setError(null)
      await apiFetch('/tweets', {
        method: 'POST',
        body: { text },
      })
      pushToast('Tweet posted', 'success')
      navigate('/home')
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError(err.message || 'Invalid tweet')
        pushToast(err.message || 'Invalid tweet', 'error')
        return
      }
      setError('Failed to post tweet')
      pushToast('Failed to post tweet', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className='mx-auto max-w-2xl'>
      <h1 className='text-2xl font-semibold text-[var(--text-primary)]'>Compose Tweet</h1>

      <Card as='form' className='mt-4 space-y-3 p-4 md:p-5' onSubmit={onSubmit}>
        <label htmlFor='compose-text' className='text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent-300)]'>
          Tweet Text
        </label>
        <textarea
          id='compose-text'
          className='focus-ring mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[color:var(--bg-layer-3)]/70 px-3 py-2 text-[var(--text-primary)]'
          rows={6}
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            setError(null)
          }}
        />

        <p className='text-sm text-[var(--accent-300)]'>{text.length}/240</p>
        {isTooLong ? <p className='text-sm text-red-300'>Tweet cannot exceed 240 characters</p> : null}
        {error ? (
          <p role='alert' className='text-sm text-red-300'>
            {error}
          </p>
        ) : null}

        <Button type='submit' variant='primary' disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? 'Posting...' : 'Post Tweet'}
        </Button>
      </Card>
    </main>
  )
}
