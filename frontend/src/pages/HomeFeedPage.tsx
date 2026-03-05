import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { apiFetch } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { TweetCard, type Tweet } from '../components/TweetCard'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

const PAGE_SIZE = 20
type FeedItem = {
  id?: number | string
  tweet_id?: number | string
  author_username?: string
  text?: string
  likeCount?: number
  like_count?: number
  likedByMe?: boolean
  is_liked_by_me?: boolean
  retweetedByMe?: boolean
  is_retweeted_by_me?: boolean
}

type FeedResponse = FeedItem[] | { items?: FeedItem[] }

function normalizeFeedResponse(payload: FeedResponse): Tweet[] {
  const rawItems = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : []

  return rawItems
    .map((item): Tweet | null => {
      const id = item.id ?? item.tweet_id
      if (id === undefined || id === null) return null
      if (!item.author_username || !item.text) return null

      return {
        id,
        author_username: item.author_username,
        text: item.text,
        likeCount: item.likeCount ?? item.like_count ?? 0,
        likedByMe: item.likedByMe ?? item.is_liked_by_me ?? false,
        retweetedByMe: item.retweetedByMe ?? item.is_retweeted_by_me ?? false,
      }
    })
    .filter((tweet): tweet is Tweet => tweet !== null)
}

export function HomeFeedPage() {
  const { me } = useAuth()
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)

  async function loadPage(nextOffset: number, mode: 'replace' | 'append') {
    setLoading(true)
    try {
      const feedResponse = await apiFetch<FeedResponse>(`/feed?limit=${PAGE_SIZE}&offset=${nextOffset}`)
      const feed = normalizeFeedResponse(feedResponse)
      if (mode === 'replace') {
        setTweets(feed)
      } else {
        setTweets((prev) => [...prev, ...feed])
      }
      setOffset(nextOffset)
    } catch {
      if (mode === 'replace') {
        setTweets([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPage(0, 'replace')
  }, [])

  useEffect(() => {
    function onDemoSeeded() {
      void loadPage(0, 'replace')
    }
    window.addEventListener('chirper:demo-seeded', onDemoSeeded)
    return () => {
      window.removeEventListener('chirper:demo-seeded', onDemoSeeded)
    }
  }, [])

  return (
    <div className='space-y-5'>
      <Card className='p-4'>
        <h1 className='text-2xl font-semibold text-[var(--text-primary)]'>Home Feed</h1>
        {me ? <p className='mt-1 text-sm text-[var(--text-secondary)]'>Signed in as {me.username}</p> : null}
        <div className='mt-3 flex flex-wrap gap-2'>
          <Link
            to='/compose'
            className='focus-ring rounded-[var(--radius-md)] border border-[var(--accent-400)] bg-[color:var(--accent-500)]/15 px-3 py-1.5 text-sm font-semibold text-[var(--accent-200)] transition hover:bg-[color:var(--accent-500)]/22'
          >
            New post
          </Link>
          <Link
            to='/discover'
            className='focus-ring rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[color:var(--bg-layer-3)]/60 px-3 py-1.5 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-500)] hover:bg-[color:var(--accent-500)]/10'
          >
            Find accounts
          </Link>
        </div>
      </Card>

      <div className='flex gap-2'>
        <Button
          type='button'
          size='sm'
          onClick={() => {
            void loadPage(0, 'replace')
          }}
        >
          Refresh
        </Button>
        <Button
          type='button'
          size='sm'
          onClick={() => {
            void loadPage(offset + PAGE_SIZE, 'append')
          }}
        >
          Load more
        </Button>
      </div>

      {loading ? (
        <div aria-label='Loading' className='space-y-3'>
          {[1, 2, 3].map((n) => (
            <Card key={n} className='animate-pulse p-4'>
              <div className='h-4 w-24 rounded bg-[color:var(--bg-layer-3)]' />
              <div className='mt-3 h-3 w-full rounded bg-[color:var(--bg-layer-3)]/85' />
              <div className='mt-2 h-3 w-3/4 rounded bg-[color:var(--bg-layer-3)]/70' />
            </Card>
          ))}
        </div>
      ) : null}
      {!loading && tweets.length === 0 ? (
        <Card className='p-6 text-center'>
          <p className='text-sm text-[var(--text-secondary)]'>No posts yet. Follow users in Discover to build your feed.</p>
        </Card>
      ) : null}

      <div className='space-y-3'>
        {tweets.map((tweet) => (
          <TweetCard
            key={tweet.id}
            tweet={tweet}
            currentUsername={me?.username}
            onDelete={(tweetId) => {
              setTweets((prev) => prev.filter((item) => item.id !== tweetId))
            }}
          />
        ))}
      </div>
    </div>
  )
}
