import { useEffect } from 'react'

import { useAuth } from '../auth/useAuth'
import { ComposeCard } from '../components/ComposeCard'
import { EmptyState } from '../components/EmptyState'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { TweetCard } from '../components/TweetCard'
import { useFeed } from '../feed/FeedContext'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

export function HomeFeedPage() {
  const { me } = useAuth()
  const { items, loading, loaded, error, loadFeed, refreshFeed, loadMore, prependCreatedPost, removePost } = useFeed()

  useEffect(() => {
    if (!loaded) {
      void loadFeed(0, 'replace')
    }
  }, [loadFeed, loaded])

  return (
    <div className='space-y-5'>
      <div className='flex items-end justify-between gap-3 border-b border-[var(--border-subtle)] pb-4'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.2em] text-[var(--soft-accent)]'>Home</p>
          <h1 className='mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)]'>Home Feed</h1>
          <p className='mt-2 max-w-xl text-sm font-medium text-[var(--text-secondary)]'>
            New posts, replies, and reposts from the people and communities you follow.
          </p>
          {me ? (
            <>
              <p className='mt-2 text-sm text-[var(--text-secondary)]'>@{me.username}</p>
              <p className='sr-only'>Signed in as {me.username}</p>
            </>
          ) : null}
        </div>
        <Button type='button' size='sm' variant='ghost' onClick={() => void refreshFeed()}>
          Refresh
        </Button>
      </div>

      <ComposeCard
        username={me?.username}
        title="What's happening?"
        helperText='Share a post with your network.'
        placeholder='Share a post'
        onPosted={(tweetId, text) => {
          prependCreatedPost({
            id: tweetId,
            authorUsername: me?.username ?? 'me',
            text,
          })
        }}
      />

      {error ? (
        <Card className='border-red-500/40 bg-red-500/10 p-4'>
          <p role='alert' className='text-sm text-red-100'>{error}</p>
        </Card>
      ) : null}

      {loading && items.length === 0 ? <LoadingSkeleton count={3} /> : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          eyebrow='Quiet feed'
          title='No posts yet.'
          description='New posts and replies will appear here.'
        />
      ) : null}

      <div className='space-y-4'>
        {items.map((tweet) => (
          <TweetCard
            key={`${tweet.kind}-${tweet.id}`}
            tweet={tweet}
            currentUsername={me?.username}
            onDelete={(tweetId) => {
              removePost(tweetId)
            }}
          />
        ))}
      </div>

      {!loading && items.length > 0 ? (
        <div className='flex justify-center'>
          <Button type='button' size='sm' variant='secondary' onClick={() => void loadMore()}>
            Load more posts
          </Button>
        </div>
      ) : null}
    </div>
  )
}
