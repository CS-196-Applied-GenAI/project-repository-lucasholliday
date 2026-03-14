import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { apiFetch } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { EmptyState } from '../components/EmptyState'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { ProfileHeader } from '../components/ProfileHeader'
import { TweetCard, type Tweet } from '../components/TweetCard'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { TextField } from '../ui/TextField'
import { useToast } from '../ui/toast'

type MePayload = {
  user_id?: number
  username: string
  bio?: string | null
  profile_picture?: string | null
  follower_count?: number
  following_count?: number
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

export function MyProfilePage() {
  const { me, setMe } = useAuth()
  const { pushToast } = useToast()
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [profilePicture, setProfilePicture] = useState('')
  const [profile, setProfile] = useState<MePayload | null>(() =>
    me
      ? {
          username: me.username,
          bio: me.bio ?? null,
          profile_picture: me.profile_picture ?? null,
          posts: [],
        }
      : null,
  )
  const [loading, setLoading] = useState(() => !me)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const displayProfile =
    profile ??
    (me
      ? {
          username: me.username,
          bio: me.bio ?? null,
          profile_picture: me.profile_picture ?? null,
          posts: [],
        }
      : null)

  async function loadProfile() {
    try {
      setError(null)
      if (!profile?.username) {
        setLoading(true)
      }
      const payload = await apiFetch<MePayload>('/users/me')
      setProfile(payload)
      setUsername(payload.username)
      setBio(payload.bio ?? '')
      setProfilePicture(payload.profile_picture ?? '')
      if (
        me?.username !== payload.username ||
        (me?.bio ?? null) !== (payload.bio ?? null) ||
        (me?.profile_picture ?? null) !== (payload.profile_picture ?? null)
      ) {
        setMe({
          username: payload.username,
          bio: payload.bio ?? null,
          profile_picture: payload.profile_picture ?? null,
        })
      }
    } catch {
      if (!profile?.username && me) {
        setProfile({
          username: me.username,
          bio: me.bio ?? null,
          profile_picture: me.profile_picture ?? null,
          posts: [],
        })
        setUsername(me.username)
        setBio(me.bio ?? '')
        setProfilePicture(me.profile_picture ?? '')
      } else if (!profile?.username) {
        setError('Could not load your profile')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!me) {
      return
    }

    setProfile((current) =>
      current ?? {
        username: me.username,
        bio: me.bio ?? null,
        profile_picture: me.profile_picture ?? null,
        posts: [],
      },
    )
    setUsername(me.username)
    setBio(me.bio ?? '')
    setProfilePicture(me.profile_picture ?? '')
    setLoading(false)
    void loadProfile()
  }, [me])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSaving(true)
      const updated = await apiFetch<MePayload>('/users/me', {
        method: 'PATCH',
        body: {
          username,
          bio,
          profile_picture: profilePicture,
        },
      })
      setProfile((current) => ({
        ...current,
        ...updated,
        posts: current?.posts ?? [],
      }))
      setError(null)
      setUsername(updated.username)
      setBio(updated.bio ?? '')
      setProfilePicture(updated.profile_picture ?? '')
      setMe({
        username: updated.username,
        bio: updated.bio ?? null,
        profile_picture: updated.profile_picture ?? null,
      })
      pushToast('Profile updated', 'success')
    } catch {
      pushToast('Could not save profile', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const posts: Tweet[] =
    displayProfile?.posts?.map((item) => ({
      id: item.tweet_id,
      authorUsername: item.author_username ?? displayProfile.username,
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
      <h1 className='sr-only'>My Profile</h1>
      {loading && !displayProfile ? <LoadingSkeleton count={2} compact /> : null}
      {displayProfile ? (
        <>
          <ProfileHeader
            username={displayProfile.username}
            bio={displayProfile.bio ?? 'No bio'}
            profilePicture={displayProfile.profile_picture}
            followerCount={displayProfile.follower_count}
            followingCount={displayProfile.following_count}
            isOwnProfile
            actions={
              <Link
                to='/home'
                className='focus-ring rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[color:var(--bg-layer-3)]/60 px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-500)] hover:bg-[color:var(--accent-500)]/10'
              >
                Back
              </Link>
            }
          />

          <div className='grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]'>
            <div className='space-y-4'>
              <Card className='p-5'>
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-300)]'>Your posts</p>
                    <h2 className='mt-2 text-2xl font-semibold text-[var(--text-primary)]'>Posts</h2>
                  </div>
                </div>
              </Card>

              {posts.length === 0 ? (
                <EmptyState
                  eyebrow='No posts yet'
                  title='Create your first post.'
                  description='Posts you share will appear here.'
                  action={
                    <Link
                      to='/compose'
                      className='focus-ring rounded-[var(--radius-md)] border border-[var(--accent-400)] bg-[color:var(--accent-500)]/15 px-4 py-2 text-sm font-semibold text-[var(--accent-200)] transition hover:bg-[color:var(--accent-500)]/22'
                    >
                      Create a post
                    </Link>
                  }
                />
              ) : (
                <div className='space-y-4'>
                  {posts.map((tweet) => (
                    <TweetCard key={tweet.id} tweet={tweet} currentUsername={me?.username} />
                  ))}
                </div>
              )}
            </div>

            <Card as='form' className='h-fit space-y-4 p-5' onSubmit={onSubmit}>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-300)]'>Edit profile</p>
                <h2 className='mt-2 text-2xl font-semibold text-[var(--text-primary)]'>Profile</h2>
                <p className='mt-2 text-sm leading-6 text-[var(--text-secondary)]'>Keep your profile up to date.</p>
              </div>

              <TextField id='profile-username' label='Username' value={username} onChange={(event) => setUsername(event.target.value)} />
              <TextField id='profile-bio' label='Bio' value={bio} onChange={(event) => setBio(event.target.value)} />
              <TextField
                id='profile-picture'
                label='Profile Picture URL'
                value={profilePicture}
                onChange={(event) => setProfilePicture(event.target.value)}
              />

              {error ? <p role='alert' className='text-sm text-red-200'>{error}</p> : null}

              <Button type='submit' variant='primary' disabled={isSaving} className='w-full'>
                Save
              </Button>
            </Card>
          </div>
        </>
      ) : null}
      {!loading && !displayProfile ? (
        <EmptyState
          eyebrow='Profile unavailable'
          title='We could not load your profile.'
          description='Please try again.'
        />
      ) : null}
    </main>
  )
}
