import { Link, useParams } from 'react-router-dom'

import { getReplies } from '../storage/repliesStore'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { CommentIcon } from '../ui/icons'

export function RepliesPage() {
  const { tweetId = '' } = useParams()
  const replies = getReplies(tweetId)

  return (
    <section className='space-y-4'>
      <h1 className='text-2xl font-semibold text-[var(--text-primary)]'>Replies for Tweet {tweetId}</h1>
      <Card className='p-3 text-sm text-[var(--text-secondary)]'>
        Original tweet placeholder: {tweetId}
      </Card>

      <Link to={`/tweet/${tweetId}/reply`} aria-label='Reply to tweet'>
        <Button size='sm' className='inline-flex items-center gap-2'>
          <CommentIcon width={15} height={15} />
          Reply
        </Button>
      </Link>

      {replies.length === 0 ? <Card className='p-4 text-sm text-[var(--text-secondary)]'>No replies yet</Card> : null}
      <ul className='space-y-2'>
        {replies.map((reply) => (
          <li key={reply.id}>
            <Card className='p-3'>
              <div className='flex items-start gap-3'>
                <Avatar username={reply.author_username} size='sm' />
                <div className='min-w-0'>
                  <p className='text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-300)]'>
                    {reply.author_username}
                  </p>
                  <p className='mt-1 text-[var(--text-primary)]'>{reply.text}</p>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}
