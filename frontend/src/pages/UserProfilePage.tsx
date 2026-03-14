import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ApiError, apiFetch } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { ProfileHeader } from '../components/ProfileHeader'
import { TweetCard, type Tweet } from '../components/TweetCard'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useToast } from '../ui/toast'

type UserProfilePayload = {
  username: string
  bio?: string | null
  profile_picture?: string | null
  follower_count?: number
  following_count?: number
  is_following?: boolean
  is_blocked?: boolean
  posts?: Array<{
    tweet_id: number | string
    author_username?: string
    text: string
    created_at?: string
    like_count?: number
    is_liked_by_me?: boolean
    retweeted_from?: number | string | null
  }>
}

export function UserProfilePage() {
  const { username } = useParams()
  const { pushToast } = useToast()
  const [profile, setProfile] = useState<UserProfilePayload | null>(() =>
    username
      ? {
          username,
          posts: [],
          is_following: false,
          is_blocked: false,
        }
      : null,
  )
  const [isFollowing, setIsFollowing] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadProfile() {
    if (!username) return
    try {
      setLoading(true)
      setError(null)
      const payload = await apiFetch<UserProfilePayload>(`/users/${username}`)
      setProfile(payload)
      if (typeof payload.is_following === 'boolean') {
        setIsFollowing(payload.is_following)
      }
      if (typeof payload.is_blocked === 'boolean') {
        setIsBlocked(payload.is_blocked)
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('User not found')
      } else {
        setError('Could not load profile')
      }
      setProfile((current) => current ?? { username, posts: [], is_following: false, is_blocked: false })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setIsFollowing(false)
    setIsBlocked(false)
    setError(null)
    setProfile({
      username: username ?? 'unknown',
      posts: [],
      is_following: false,
      is_blocked: false,
    })
    void loadProfile()
  }, [username])

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
      await loadProfile()
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
      await loadProfile()
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

  const posts: Tweet[] =
    profile?.posts?.map((item) => ({
      id: item.tweet_id,
      authorUsername: item.author_username ?? profile.username,
      text: item.text,
      createdAt: item.created_at,
      likeCount: item.like_count ?? 0,
      likedByMe: item.is_liked_by_me ?? false,
      repostedByMe: false,
      kind: item.retweeted_from ? 'repost' : 'post',
      source: 'server',
      originalPostId: item.retweeted_from,
      originalPost: null,
      replyToUsername: null,
    })) ?? []

  return (
    <main className='space-y-5'>
      <h1 className='sr-only'>Profile</h1>
      {loading ? <LoadingSkeleton count={2} compact /> : null}
      {profile ? (
        <>
          <ProfileHeader
            username={profile.username}
            bio={profile.bio}
            profilePicture={profile.profile_picture}
            followerCount={profile.follower_count}
            followingCount={profile.following_count}
            actions={
              <>
                {!isBlocked ? (
                  <Button type='button' size='sm' onClick={() => void onToggleFollow()}>
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </Button>
                ) : null}
                <Button type='button' variant='danger' size='sm' onClick={() => void onToggleBlock()}>
                  {isBlocked ? 'Unblock' : 'Block'}
                </Button>
                <Link
                  to='/home'
                  className='focus-ring rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[color:var(--bg-layer-3)]/60 px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-500)] hover:bg-[color:var(--accent-500)]/10'
                >
                  Back
                </Link>
              </>
            }
          />

          {isBlocked ? (
            <Card className='border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-100'>
              This profile is hidden.
            </Card>
          ) : null}

          {error ? <p role='alert' className='text-sm text-red-200'>{error}</p> : null}

          {posts.length === 0 ? (
            <Card className='p-5'>
              <p className='text-sm text-[var(--accent-300)]'>Posts</p>
              <EmptyState
                title='No posts yet.'
                description='Posts from this profile will appear here.'
              />
            </Card>
          ) : (
            <div className='space-y-4'>
              {posts.map((tweet) => (
                <TweetCard key={tweet.id} tweet={tweet} />
              ))}
            </div>
          )}
        </>
      ) : null}
      {!loading && !profile ? (
        <EmptyState
          eyebrow='Profile unavailable'
          title='Profile unavailable'
          description={error ?? 'This account may not exist or may be unavailable right now.'}
        />
      ) : null}
    </main>
  )
}
