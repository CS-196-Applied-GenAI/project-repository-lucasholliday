import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { ApiError, apiFetch } from '../api/client'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useToast } from '../ui/toast'

const MAX_POST_LENGTH = 240

type ComposeResult = {
  id?: number | string
  tweet_id?: number | string
}

type ComposeCardProps = {
  username?: string
  title?: string
  placeholder?: string
  submitLabel?: string
  helperText?: string
  fieldLabel?: string
  onPosted?: (tweetId: number | string, text: string) => void
  onSuccess?: () => void
}

export function ComposeCard({
  username,
  title = "What's happening?",
  placeholder = 'Share a post',
  submitLabel = 'Post',
  helperText = 'Start a conversation.',
  fieldLabel = 'Post text',
  onPosted,
  onSuccess,
}: ComposeCardProps) {
  const { pushToast } = useToast()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isTooLong = text.length > MAX_POST_LENGTH

  const canSubmit = useMemo(() => text.trim().length > 0 && text.length <= MAX_POST_LENGTH, [text])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit || isSubmitting) return

    try {
      setIsSubmitting(true)
      setError(null)
      const payload = await apiFetch<ComposeResult>('/tweets', {
        method: 'POST',
        body: { text: text.trim() },
      })
      const tweetId = payload.tweet_id ?? payload.id
      setText('')
      pushToast('Post published', 'success')
      onSuccess?.()
      if (tweetId !== undefined && tweetId !== null) {
        onPosted?.(tweetId, text.trim())
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError(err.message || 'Invalid post')
        pushToast(err.message || 'Invalid post', 'error')
        return
      }
      setError('Failed to publish post')
      pushToast('Failed to publish post', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card as='form' className='border-[var(--border-strong)] p-5 shadow-[var(--shadow-elevated)]' onSubmit={onSubmit}>
      <div className='flex items-start gap-3'>
        <Avatar username={username ?? 'grove'} />
        <div className='min-w-0 flex-1'>
          <p className='text-base font-semibold text-[var(--text-primary)]'>{title}</p>
          <p className='mt-1 text-sm text-[var(--text-secondary)]'>{helperText}</p>
        </div>
      </div>
      <div className='mt-4'>
        <label htmlFor='compose-text' className='sr-only'>
          {fieldLabel}
        </label>
        <textarea
          id='compose-text'
          className='focus-ring mt-2 min-h-32 w-full resize-y rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-layer-1)] px-4 py-3 text-sm leading-7 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition duration-150 hover:border-[var(--accent-500)]'
          placeholder={placeholder}
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            setError(null)
          }}
        />
        <div className='mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='text-sm text-[var(--text-secondary)]'>{text.length}/{MAX_POST_LENGTH}</p>
            {isTooLong ? <p className='mt-1 text-sm text-red-200'>Post cannot exceed 240 characters</p> : null}
            {error ? <p role='alert' className='mt-1 text-sm text-red-200'>{error}</p> : null}
          </div>
          <Button type='submit' variant='primary' disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Posting...' : submitLabel}
          </Button>
        </div>
      </div>
    </Card>
  )
}
