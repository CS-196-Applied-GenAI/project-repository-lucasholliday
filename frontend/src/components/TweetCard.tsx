import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError, apiFetch } from '../api/client'
import { Avatar } from '../ui/Avatar'
import { Card } from '../ui/Card'
import { IconButton } from '../ui/IconButton'
import { CommentIcon, RepeatIcon, ShareIcon, ThumbUpIcon, TrashIcon } from '../ui/icons'
import { useToast } from '../ui/toast'

export type Tweet = {
  id: number | string
  author_username: string
  text: string
  likeCount?: number
  likedByMe?: boolean
  retweetedByMe?: boolean
}

type TweetCardProps = {
  tweet: Tweet
  currentUsername?: string
  onDelete?: (tweetId: number | string) => void
}

export function TweetCard({ tweet, currentUsername, onDelete }: TweetCardProps) {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [likeCount, setLikeCount] = useState(Number(tweet.likeCount ?? 0))
  const [likedByMe, setLikedByMe] = useState(Boolean(tweet.likedByMe))
  const [retweetedByMe, setRetweetedByMe] = useState(Boolean(tweet.retweetedByMe))
  const [isLikePending, setIsLikePending] = useState(false)
  const [isRetweetPending, setIsRetweetPending] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)
  const [likeError, setLikeError] = useState<string | null>(null)
  const [retweetError, setRetweetError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function onToggleLike() {
    if (isLikePending) return
    const nextLiked = !likedByMe
    setLikeError(null)
    setLikedByMe(nextLiked)
    setLikeCount((prev) => prev + (nextLiked ? 1 : -1))
    setIsLikePending(true)

    try {
      if (nextLiked) {
        await apiFetch(`/tweets/${tweet.id}/like`, { method: 'POST' })
      } else {
        await apiFetch(`/tweets/${tweet.id}/like`, { method: 'DELETE' })
      }
      pushToast(nextLiked ? 'Liked tweet' : 'Removed like', 'success')
    } catch {
      setLikedByMe(!nextLiked)
      setLikeCount((prev) => prev + (nextLiked ? -1 : 1))
      setLikeError('Failed to update like')
      pushToast('Could not update like', 'error')
    } finally {
      setIsLikePending(false)
    }
  }

  async function onToggleRetweet() {
    if (isRetweetPending) return
    const nextRetweeted = !retweetedByMe
    setRetweetError(null)
    setRetweetedByMe(nextRetweeted)
    setIsRetweetPending(true)

    try {
      if (nextRetweeted) {
        await apiFetch(`/tweets/${tweet.id}/retweet`, { method: 'POST' })
      } else {
        await apiFetch(`/tweets/${tweet.id}/retweet`, { method: 'DELETE' })
      }
      pushToast(nextRetweeted ? 'Retweeted' : 'Removed repost', 'success')
    } catch {
      setRetweetedByMe(!nextRetweeted)
      setRetweetError('Failed to update retweet')
      pushToast('Could not update repost', 'error')
    } finally {
      setIsRetweetPending(false)
    }
  }

  async function onDeleteTweet() {
    if (isDeletePending) return
    setDeleteError(null)
    setIsDeletePending(true)
    try {
      await apiFetch(`/tweets/${tweet.id}`, { method: 'DELETE' })
      onDelete?.(tweet.id)
      pushToast('Tweet deleted', 'success')
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setDeleteError('Action not allowed')
        pushToast('Action not allowed', 'error')
        return
      }
      if (err instanceof ApiError && err.status === 404) {
        setDeleteError('Not found')
        pushToast('Tweet not found', 'error')
        return
      }
      setDeleteError('Failed to delete tweet')
      pushToast('Could not delete tweet', 'error')
    } finally {
      setIsDeletePending(false)
    }
  }

  async function onShare() {
    const url = `${window.location.origin}/tweet/${tweet.id}/replies`
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        pushToast('Post link copied', 'success')
        return
      }
    } catch {
      // fall through to fallback prompt
    }
    window.prompt('Copy this link:', url)
  }

  const canDelete = Boolean(currentUsername && currentUsername === tweet.author_username)

  return (
    <Card className='p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-elevated)]'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <Avatar username={tweet.author_username} />
          <div>
            <Link
              to={`/u/${tweet.author_username}`}
              className='premium-link text-sm font-semibold uppercase tracking-[0.12em]'
            >
              @{tweet.author_username}
            </Link>
            <p className='text-xs text-[var(--text-muted)]'>now</p>
          </div>
        </div>
        {canDelete ? (
          <IconButton
            type='button'
            aria-label='Delete'
            disabled={isDeletePending}
            icon={<TrashIcon width={16} height={16} />}
            onClick={onDeleteTweet}
            className='border-red-500/60 text-red-200 hover:border-red-400/80 hover:text-red-100'
          />
        ) : null}
      </div>

      <p className='mt-3 whitespace-pre-wrap text-[15px] leading-6 text-[var(--text-primary)]'>{tweet.text}</p>

      <div className='mt-4 flex items-center gap-2'>
        <IconButton
          type='button'
          aria-label='View replies'
          icon={<CommentIcon width={16} height={16} />}
          onClick={() => navigate(`/tweet/${tweet.id}/replies`)}
        />
        <IconButton
          type='button'
          aria-label={retweetedByMe ? 'Unretweet' : 'Retweet'}
          disabled={isRetweetPending}
          icon={<RepeatIcon width={16} height={16} />}
          active={retweetedByMe}
          onClick={onToggleRetweet}
        />
        <IconButton
          type='button'
          aria-label={likedByMe ? 'Unlike' : 'Like'}
          disabled={isLikePending}
          icon={<ThumbUpIcon width={16} height={16} />}
          count={likeCount}
          active={likedByMe}
          onClick={onToggleLike}
        />
        <IconButton
          type='button'
          aria-label='Share'
          icon={<ShareIcon width={16} height={16} />}
          onClick={() => {
            void onShare()
          }}
        />
      </div>

      {likeError ? (
        <p role='alert' className='mt-2 text-sm text-red-300'>
          {likeError}
        </p>
      ) : null}
      {retweetError ? (
        <p role='alert' className='mt-2 text-sm text-red-300'>
          {retweetError}
        </p>
      ) : null}
      {deleteError ? (
        <p role='alert' className='mt-2 text-sm text-red-300'>
          {deleteError}
        </p>
      ) : null}
    </Card>
  )
}
