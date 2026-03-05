import * as React from 'react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { addReply } from '../storage/repliesStore'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

const REPLY_MAX_LEN = 240

export function PostReplyPage() {
  const navigate = useNavigate()
  const { tweetId = '' } = useParams()
  const [text, setText] = useState('')
  const tooLong = text.length > REPLY_MAX_LEN
  const canSubmit = text.trim().length > 0 && !tooLong

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    addReply(tweetId, {
      id: `${Date.now()}`,
      author_username: 'me',
      text: text.trim(),
      created_at: new Date().toISOString(),
    })
    navigate(`/tweet/${tweetId}/replies`)
  }

  return (
    <section className='space-y-4'>
      <h1 className='text-2xl font-semibold text-[var(--text-primary)]'>Reply to Tweet {tweetId}</h1>
      <Card className='p-3 text-sm text-[var(--text-secondary)]'>
        Original tweet placeholder: {tweetId}
      </Card>

      <Card as='form' className='space-y-3 p-4' onSubmit={onSubmit}>
        <label htmlFor='reply-text' className='text-sm font-medium text-[var(--text-primary)]'>
          Reply text
        </label>
        <textarea
          id='reply-text'
          className='focus-ring min-h-28 w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[color:var(--bg-layer-3)]/70 p-3 text-[var(--text-primary)]'
          placeholder='Write your reply'
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <p className='text-sm text-[var(--text-secondary)]'>{text.length}/240</p>
        {tooLong ? (
          <p role='alert' className='text-sm text-red-300'>
            Reply cannot exceed 240 characters.
          </p>
        ) : null}
        <Button type='submit' disabled={!canSubmit} className='w-fit'>
          Post Reply
        </Button>
      </Card>
    </section>
  )
}
