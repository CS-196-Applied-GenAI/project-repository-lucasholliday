import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { ComposeCard } from '../components/ComposeCard'
import { useFeed } from '../feed/FeedContext'
import { Card } from '../ui/Card'

export function PostTweetPage() {
  const navigate = useNavigate()
  const { me } = useAuth()
  const { prependCreatedPost } = useFeed()

  return (
    <main className='mx-auto max-w-3xl space-y-5'>
      <h1 className='sr-only'>Create a post</h1>
      <Card className='p-5'>
        <p className='text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-300)]'>Post</p>
        <h1 className='mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)]'>Create a post</h1>
      </Card>

      <ComposeCard
        username={me?.username}
        title='Create a post'
        submitLabel='Post'
        fieldLabel='Post text'
        helperText='Share something new.'
        onPosted={(tweetId, text) => {
          prependCreatedPost({
            id: tweetId,
            authorUsername: me?.username ?? 'me',
            text,
          })
          navigate('/home')
        }}
      />

      <Card className='p-5 text-sm text-[var(--text-secondary)]'>
        <Link to='/home' className='premium-link font-semibold underline underline-offset-4'>
          Back
        </Link>
      </Card>
    </main>
  )
}
