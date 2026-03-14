import * as React from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { TweetCard } from '../components/TweetCard'
import { useFeed } from '../feed/FeedContext'
import { addReply } from '../storage/repliesStore'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

const REPLY_MAX_LEN = 240

export function PostReplyPage() {
  const navigate = useNavigate()
  const { me } = useAuth()
  const { tweetId = '' } = useParams()
  const { getPostById, ensurePost, prependReply } = useFeed()
  const [text, setText] = useState('')
  const [loadingOriginal, setLoadingOriginal] = useState(true)

  const tooLong = text.length > REPLY_MAX_LEN
  const canSubmit = text.trim().length > 0 && !tooLong
  const originalPost = tweetId ? getPostById(tweetId) : undefined

  useEffect(() => {
    if (!tweetId) {
      setLoadingOriginal(false)
      return
    }

    let active = true
    setLoadingOriginal(true)
    void ensurePost(tweetId).finally(() => {
      if (active) {
        setLoadingOriginal(false)
      }
    })

    return () => {
      active = false
    }
  }, [ensurePost, tweetId])

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit || !tweetId) return

    const replyId = `reply-${Date.now()}`
    addReply(tweetId, {
      id: replyId,
      author_username: me?.username ?? 'me',
      text: text.trim(),
      created_at: new Date().toISOString(),
      reply_to_username: originalPost?.authorUsername ?? null,
    })
    prependReply({
      id: replyId,
      authorUsername: me?.username ?? 'me',
      text: text.trim(),
      replyToUsername: originalPost?.authorUsername ?? null,
    })
    navigate(`/tweet/${tweetId}/replies`)
  }

  return (
    <section className='mx-auto max-w-3xl space-y-5'>
      <h1 className='sr-only'>Reply</h1>
      <Card className='p-5'>
        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[var(--soft-accent)]'>Reply</p>
        <h1 className='mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)]'>Reply</h1>
        <p className='mt-2 text-sm text-[var(--text-secondary)]'>
          {originalPost ? (
            <>
              Replying to <span className='text-[var(--link-accent)]'>@{originalPost.authorUsername}</span>
            </>
          ) : 'Reply to this post'}
        </p>
      </Card>

      {loadingOriginal ? (
        <Card className='p-5 text-sm text-[var(--text-secondary)]'>Loading post…</Card>
      ) : originalPost ? (
        <TweetCard tweet={originalPost} currentUsername={me?.username} variant='compact' hideActions />
      ) : (
        <Card className='p-5 text-sm text-[var(--text-secondary)]'>This post is unavailable.</Card>
      )}

      <Card as='form' className='space-y-4 p-5' onSubmit={onSubmit}>
        <label htmlFor='reply-text' className='text-xs font-semibold uppercase tracking-[0.18em] text-[var(--soft-accent)]'>Reply</label>
        <textarea
          id='reply-text'
          className='focus-ring min-h-32 w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-layer-1)] p-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]'
          placeholder='Write a reply'
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <p className='text-sm text-[var(--text-secondary)]'>{text.length}/240</p>
          <div className='flex flex-wrap items-center gap-3'>
            <Link to='/home' className='premium-link text-sm font-semibold underline underline-offset-4'>
              Back to feed
            </Link>
            <Button type='submit' disabled={!canSubmit || !originalPost} className='w-fit'>
              Reply
            </Button>
          </div>
        </div>
        {tooLong ? (
          <p role='alert' className='text-sm text-red-300'>
            Reply cannot exceed 240 characters.
          </p>
        ) : null}
      </Card>
    </section>
  )
}
