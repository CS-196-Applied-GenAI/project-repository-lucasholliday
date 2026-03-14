import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '../components/EmptyState'
import { TweetCard } from '../components/TweetCard'
import { useFeed } from '../feed/FeedContext'
import { getReplies } from '../storage/repliesStore'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { CommentIcon } from '../ui/icons'

export function RepliesPage() {
  const { tweetId = '' } = useParams()
  const { getPostById, ensurePost } = useFeed()
  const [loadingOriginal, setLoadingOriginal] = useState(true)
  const originalPost = tweetId ? getPostById(tweetId) : undefined
  const replies = getReplies(tweetId)

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

  return (
    <section className='mx-auto max-w-3xl space-y-5'>
      <Card className='p-5'>
        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[var(--soft-accent)]'>Reply</p>
        <h1 className='mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)]'>Replies</h1>
      </Card>

      {loadingOriginal ? (
        <Card className='p-5 text-sm text-[var(--text-secondary)]'>Loading post…</Card>
      ) : originalPost ? (
        <TweetCard tweet={originalPost} variant='compact' hideActions />
      ) : null}

      <Link to={`/tweet/${tweetId}/reply`} aria-label='Reply'>
        <Button size='sm' className='inline-flex items-center gap-2'>
          <CommentIcon width={15} height={15} />
          Reply
        </Button>
      </Link>

      {replies.length === 0 ? (
        <EmptyState
          eyebrow='No replies yet'
          title='Be the first to reply.'
          description='Replies will appear here.'
        />
      ) : null}

      <ul className='space-y-3'>
        {replies.map((reply) => (
          <li key={reply.id}>
            <Card className='p-4'>
              <div className='flex items-start gap-3'>
                <Avatar username={reply.author_username} size='sm' />
                <div className='min-w-0'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p className='text-sm font-semibold text-[var(--text-primary)]'>@{reply.author_username}</p>
                    <span className='text-xs text-[var(--text-muted)]'>{new Date(reply.created_at).toLocaleString()}</span>
                  </div>
                  {reply.reply_to_username ? (
                    <p className='mt-1 text-sm text-[var(--text-secondary)]'>
                      Replying to <span className='text-[var(--link-accent)]'>@{reply.reply_to_username}</span>
                    </p>
                  ) : null}
                  <p className='mt-2 text-[var(--text-primary)]'>{reply.text}</p>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}
