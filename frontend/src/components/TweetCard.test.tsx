import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'

import { FeedProvider } from '../feed/FeedContext'
import { server } from '../test/server'
import { ToastProvider } from '../ui/toast'
import { TweetCard } from './TweetCard'

function renderCard(ui: ReactNode) {
  return render(
    <ToastProvider>
      <FeedProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </FeedProvider>
    </ToastProvider>,
  )
}

describe('TweetCard', () => {
  it('renders author and post text', () => {
    renderCard(
      <TweetCard
        tweet={{
          id: 1,
          authorUsername: 'alice',
          text: 'hello grove',
          likeCount: 0,
          likedByMe: false,
          repostedByMe: false,
          kind: 'post',
          source: 'server',
          originalPost: null,
          originalPostId: null,
          replyToUsername: null,
        }}
      />,
    )

    expect(screen.getByRole('link', { name: /alice/i })).toBeInTheDocument()
    expect(screen.getByText(/hello grove/i)).toBeInTheDocument()
  })

  it('likes on first click and unlikes on second click', async () => {
    const user = userEvent.setup()
    let postCalled = 0
    let deleteCalled = 0

    server.use(
      http.post('/tweets/1/like', () => {
        postCalled += 1
        return HttpResponse.json({ ok: true })
      }),
      http.delete('/tweets/1/like', () => {
        deleteCalled += 1
        return HttpResponse.json({ ok: true })
      }),
    )

    renderCard(
      <TweetCard
        tweet={{
          id: 1,
          authorUsername: 'alice',
          text: 'hello grove',
          likeCount: 2,
          likedByMe: false,
          repostedByMe: false,
          kind: 'post',
          source: 'server',
          originalPost: null,
          originalPostId: null,
          replyToUsername: null,
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: /^like$/i }))
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /unlike/i })).toBeInTheDocument()
    expect(postCalled).toBe(1)

    await user.click(screen.getByRole('button', { name: /unlike/i }))
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^like$/i })).toBeInTheDocument()
    expect(deleteCalled).toBe(1)
  })

  it('rolls back optimistic like and shows error on failure', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('/tweets/1/like', () => {
        return HttpResponse.json({ detail: 'Server error' }, { status: 500 })
      }),
    )

    renderCard(
      <TweetCard
        tweet={{
          id: 1,
          authorUsername: 'alice',
          text: 'hello grove',
          likeCount: 0,
          likedByMe: false,
          repostedByMe: false,
          kind: 'post',
          source: 'server',
          originalPost: null,
          originalPostId: null,
          replyToUsername: null,
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: /^like$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not update like/i)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('reposts on first click and removes repost on second click', async () => {
    const user = userEvent.setup()
    let postCalled = 0
    let deleteCalled = 0

    server.use(
      http.post('/tweets/1/retweet', () => {
        postCalled += 1
        return HttpResponse.json({ tweet_id: 99 })
      }),
      http.delete('/tweets/1/retweet', () => {
        deleteCalled += 1
        return HttpResponse.json({ ok: true })
      }),
    )

    renderCard(
      <TweetCard
        currentUsername='demo'
        tweet={{
          id: 1,
          authorUsername: 'alice',
          text: 'hello grove',
          likeCount: 0,
          likedByMe: false,
          repostedByMe: false,
          kind: 'post',
          source: 'server',
          originalPost: null,
          originalPostId: null,
          replyToUsername: null,
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: /^repost$/i }))
    expect(screen.getByRole('button', { name: /undo repost/i })).toBeInTheDocument()
    expect(postCalled).toBe(1)

    await user.click(screen.getByRole('button', { name: /undo repost/i }))
    expect(screen.getByRole('button', { name: /^repost$/i })).toBeInTheDocument()
    expect(deleteCalled).toBe(1)
  })
})
