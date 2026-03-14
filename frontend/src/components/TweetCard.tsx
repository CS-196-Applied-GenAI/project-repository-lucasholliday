import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError, apiFetch } from '../api/client'
import { useFeed } from '../feed/FeedContext'
import { getActionTargetId, type FeedPost } from '../feed/postModel'
import { Avatar } from '../ui/Avatar'
import { Card } from '../ui/Card'
import { IconButton } from '../ui/IconButton'
import { CommentIcon, RepeatIcon, ShareIcon, ThumbUpIcon, TrashIcon } from '../ui/icons'
import { useToast } from '../ui/toast'

export type Tweet = FeedPost

type TweetCardProps = {
  tweet: Tweet
  currentUsername?: string
  onDelete?: (tweetId: number | string) => void
  variant?: 'default' | 'compact'
  hideActions?: boolean
}

function formatTimestamp(value?: string) {
  if (!value) return 'Just now'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Just now'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function TweetCard({
  tweet,
  currentUsername,
  onDelete,
  variant = 'default',
  hideActions = false,
}: TweetCardProps) {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { ensurePost, prependRepost, removeRepost, removePost, updatePost, attachOriginalPost } = useFeed()
  const contentPost = tweet.kind === 'repost' ? tweet.originalPost : tweet
  const actionTargetId = getActionTargetId(tweet)
  const displayPost = contentPost ?? {
    id: actionTargetId,
    authorUsername: tweet.authorUsername,
    text: '',
    createdAt: tweet.createdAt,
    likeCount: 0,
    likedByMe: false,
    repostedByMe: tweet.repostedByMe,
    kind: 'post' as const,
    source: tweet.source,
    originalPost: null,
    originalPostId: null,
    replyToUsername: null,
  }
  const [likeCount, setLikeCount] = useState(displayPost.likeCount)
  const [likedByMe, setLikedByMe] = useState(displayPost.likedByMe)
  const [repostedByMe, setRepostedByMe] = useState(displayPost.repostedByMe)
  const [isLikePending, setIsLikePending] = useState(false)
  const [isRepostPending, setIsRepostPending] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)
  const [likeError, setLikeError] = useState<string | null>(null)
  const [repostError, setRepostError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const canDelete = Boolean(
    currentUsername
    && (
      (tweet.kind === 'repost' && currentUsername === tweet.authorUsername)
      || (tweet.kind !== 'repost' && currentUsername === displayPost.authorUsername)
    ),
  )

  useEffect(() => {
    setLikeCount(displayPost.likeCount)
    setLikedByMe(displayPost.likedByMe)
    setRepostedByMe(displayPost.repostedByMe)
  }, [displayPost.likeCount, displayPost.likedByMe, displayPost.repostedByMe])

  useEffect(() => {
    if (tweet.kind !== 'repost' || !tweet.originalPostId || tweet.originalPost) return
    void ensurePost(tweet.originalPostId).then((original) => {
      if (original) {
        attachOriginalPost(tweet.id, original)
      }
    })
  }, [attachOriginalPost, ensurePost, tweet.id, tweet.kind, tweet.originalPost, tweet.originalPostId])

  async function onToggleLike() {
    if (isLikePending) return
    const nextLiked = !likedByMe
    setLikeError(null)
    setLikedByMe(nextLiked)
    setLikeCount((current) => Math.max(0, current + (nextLiked ? 1 : -1)))
    updatePost(actionTargetId, (current) => ({
      ...current,
      likedByMe: nextLiked,
      likeCount: Math.max(0, current.likeCount + (nextLiked ? 1 : -1)),
    }))
    setIsLikePending(true)

    try {
      if (nextLiked) {
        await apiFetch(`/tweets/${actionTargetId}/like`, { method: 'POST' })
      } else {
        await apiFetch(`/tweets/${actionTargetId}/like`, { method: 'DELETE' })
      }
      pushToast(nextLiked ? 'Liked post' : 'Removed like', 'success')
    } catch {
      setLikedByMe(!nextLiked)
      setLikeCount((current) => Math.max(0, current + (nextLiked ? -1 : 1)))
      updatePost(actionTargetId, (current) => ({
        ...current,
        likedByMe: !nextLiked,
        likeCount: Math.max(0, current.likeCount + (nextLiked ? -1 : 1)),
      }))
      setLikeError('Could not update like')
      pushToast('Could not update like', 'error')
    } finally {
      setIsLikePending(false)
    }
  }

  async function onToggleRepost() {
    if (isRepostPending || !currentUsername) return
    const nextReposted = !repostedByMe
    setRepostError(null)
    setRepostedByMe(nextReposted)
    updatePost(actionTargetId, (current) => ({
      ...current,
      repostedByMe: nextReposted,
    }))
    setIsRepostPending(true)

    try {
      if (nextReposted) {
        const payload = await apiFetch<{ tweet_id?: number | string }>(`/tweets/${actionTargetId}/retweet`, { method: 'POST' })
        const repostId = payload.tweet_id ?? `repost-${actionTargetId}-${Date.now()}`
        prependRepost({
          id: repostId,
          authorUsername: currentUsername,
          originalPost: displayPost,
        })
        pushToast('Repost added', 'success')
      } else {
        await apiFetch(`/tweets/${actionTargetId}/retweet`, { method: 'DELETE' })
        removeRepost({
          repostId: tweet.kind === 'repost' ? tweet.id : undefined,
          originalPostId: actionTargetId,
          authorUsername: currentUsername,
        })
        pushToast('Repost removed', 'success')
      }
    } catch {
      setRepostedByMe(!nextReposted)
      updatePost(actionTargetId, (current) => ({
        ...current,
        repostedByMe: !nextReposted,
      }))
      setRepostError('Could not update repost')
      pushToast('Could not update repost', 'error')
    } finally {
      setIsRepostPending(false)
    }
  }

  async function onDeletePost() {
    if (isDeletePending) return
    setDeleteError(null)
    setIsDeletePending(true)

    try {
      await apiFetch(`/tweets/${tweet.id}`, { method: 'DELETE' })
      removePost(tweet.id)
      onDelete?.(tweet.id)
      pushToast('Post deleted', 'success')
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setDeleteError('Action not allowed')
      } else if (err instanceof ApiError && err.status === 404) {
        setDeleteError('Post not found')
      } else {
        setDeleteError('Could not delete post')
      }
      pushToast('Could not delete post', 'error')
    } finally {
      setIsDeletePending(false)
    }
  }

  async function onShare() {
    const url = `${window.location.origin}/tweet/${actionTargetId}/replies`
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        pushToast('Post link copied', 'success')
        return
      }
    } catch {
      // fall through to prompt
    }
    window.prompt('Copy this link:', url)
  }

  const wrapperClass =
    variant === 'compact'
      ? 'p-4'
      : 'p-0 transition duration-150 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-soft)]'
  const bodyClass = variant === 'compact' ? 'mt-3' : 'px-5 py-4'
  const headerPadding = variant === 'compact' ? '' : 'border-b border-[var(--border-subtle)] px-5 py-4'

  function renderPostContent(post: FeedPost, nested = false) {
    return (
      <div className={nested ? 'rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-layer-1)] px-4 py-4' : ''}>
        <div className='flex items-start justify-between gap-3'>
          <Avatar username={post.authorUsername} size={nested || variant === 'compact' ? 'sm' : 'md'} />
          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
              <Link to={`/u/${post.authorUsername}`} className='premium-link text-base font-semibold tracking-tight'>
                @{post.authorUsername}
              </Link>
              <span className='rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]'>
                {formatTimestamp(post.createdAt)}
              </span>
            </div>
            {post.kind === 'reply' && post.replyToUsername ? (
              <p className='mt-2 text-sm text-[var(--text-secondary)]'>
                Replying to <span className='text-[var(--link-accent)]'>@{post.replyToUsername}</span>
              </p>
            ) : null}
            <p className='mt-3 whitespace-pre-wrap text-[15px] leading-7 text-[var(--text-primary)]'>
              {post.text || 'Post'}
            </p>
          </div>
          {!nested && canDelete ? (
            <IconButton
              type='button'
              aria-label='Delete'
              disabled={isDeletePending}
              icon={<TrashIcon width={16} height={16} />}
              onClick={onDeletePost}
              className='border-red-500/50 text-red-200 hover:border-red-400/70 hover:text-red-100'
            />
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <Card className={wrapperClass}>
      {tweet.kind === 'repost' ? (
        <div className={variant === 'compact' ? 'space-y-3' : 'space-y-0'}>
          <div className={headerPadding || 'pb-1'}>
            <div className='flex items-center gap-2 text-sm text-[var(--text-secondary)]'>
              <RepeatIcon width={15} height={15} />
              <span>
                <span className='text-[var(--link-accent)]'>@{tweet.authorUsername}</span> reposted
              </span>
            </div>
          </div>
          <div className={bodyClass}>
            {renderPostContent(displayPost, true)}
          </div>
        </div>
      ) : (
        <>
          <div className={headerPadding}>{renderPostContent(displayPost)}</div>
          {variant !== 'compact' ? null : null}
        </>
      )}

      {!hideActions ? (
        <div className={tweet.kind === 'repost' ? 'px-5 pb-4 pt-0' : variant === 'compact' ? 'mt-4' : 'px-5 pb-4 pt-0'}>
          <div className='flex flex-wrap items-center gap-2'>
            <IconButton
              type='button'
              aria-label='Reply'
              icon={<CommentIcon width={16} height={16} />}
              onClick={() => navigate(`/tweet/${actionTargetId}/reply`)}
            />
            <IconButton
              type='button'
              aria-label={repostedByMe ? 'Undo repost' : 'Repost'}
              disabled={isRepostPending}
              icon={<RepeatIcon width={16} height={16} />}
              active={repostedByMe}
              onClick={onToggleRepost}
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

          {likeError ? <p role='alert' className='mt-3 text-sm text-red-300'>{likeError}</p> : null}
          {repostError ? <p role='alert' className='mt-3 text-sm text-red-300'>{repostError}</p> : null}
          {deleteError ? <p role='alert' className='mt-3 text-sm text-red-300'>{deleteError}</p> : null}
        </div>
      ) : null}
    </Card>
  )
}
