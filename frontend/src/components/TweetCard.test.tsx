import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'

import { server } from '../test/server'
import { TweetCard } from './TweetCard'

describe('TweetCard', () => {
  it('renders author and tweet text', () => {
    render(
      <MemoryRouter>
        <TweetCard
          tweet={{
            id: 1,
            author_username: 'alice',
            text: 'hello chirper',
          }}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /alice/i })).toBeInTheDocument()
    expect(screen.getByText(/hello chirper/i)).toBeInTheDocument()
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

    render(
      <MemoryRouter>
        <TweetCard tweet={{ id: 1, author_username: 'alice', text: 'hello chirper', likeCount: 2 }} />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /like/i }))
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

    render(
      <MemoryRouter>
        <TweetCard tweet={{ id: 1, author_username: 'alice', text: 'hello chirper', likeCount: 0 }} />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /^like$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to update like/i)
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^like$/i })).toBeInTheDocument()
  })

  it('retweets on first click and unretweets on second click', async () => {
    const user = userEvent.setup()
    let postCalled = 0
    let deleteCalled = 0

    server.use(
      http.post('/tweets/1/retweet', () => {
        postCalled += 1
        return HttpResponse.json({ ok: true })
      }),
      http.delete('/tweets/1/retweet', () => {
        deleteCalled += 1
        return HttpResponse.json({ ok: true })
      }),
    )

    render(
      <MemoryRouter>
        <TweetCard tweet={{ id: 1, author_username: 'alice', text: 'hello chirper' }} />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /^retweet$/i }))
    expect(screen.getByRole('button', { name: /unretweet/i })).toBeInTheDocument()
    expect(postCalled).toBe(1)

    await user.click(screen.getByRole('button', { name: /unretweet/i }))
    expect(screen.getByRole('button', { name: /^retweet$/i })).toBeInTheDocument()
    expect(deleteCalled).toBe(1)
  })

  it('rolls back optimistic retweet and shows error on failure', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('/tweets/1/retweet', () => {
        return HttpResponse.json({ detail: 'Server error' }, { status: 500 })
      }),
    )

    render(
      <MemoryRouter>
        <TweetCard tweet={{ id: 1, author_username: 'alice', text: 'hello chirper' }} />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /^retweet$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to update retweet/i)
    expect(screen.getByRole('button', { name: /^retweet$/i })).toBeInTheDocument()
  })
})
