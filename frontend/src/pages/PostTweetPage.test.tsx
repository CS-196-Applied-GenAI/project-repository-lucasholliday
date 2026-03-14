import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'

import { AuthProvider } from '../auth/AuthContext'
import { FeedProvider } from '../feed/FeedContext'
import { AppRoutes } from '../routes/Router'
import { server } from '../test/server'
import { PostTweetPage } from './PostTweetPage'

describe('PostTweetPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('disables submit and shows error when text exceeds 240 chars', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <AuthProvider>
          <FeedProvider>
            <PostTweetPage />
          </FeedProvider>
        </AuthProvider>
      </MemoryRouter>,
    )

    const tooLong = 'a'.repeat(241)
    await user.type(screen.getByLabelText(/post text/i), tooLong)

    expect(screen.getAllByRole('button', { name: /^post$/i }).at(-1)).toBeDisabled()
    expect(screen.getByText(/post cannot exceed 240 characters/i)).toBeInTheDocument()
  })

  it('enables submit when text length is exactly 240', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <AuthProvider>
          <FeedProvider>
            <PostTweetPage />
          </FeedProvider>
        </AuthProvider>
      </MemoryRouter>,
    )

    const maxLen = 'a'.repeat(240)
    await user.type(screen.getByLabelText(/post text/i), maxLen)

    expect(screen.getAllByRole('button', { name: /^post$/i }).at(-1)).toBeEnabled()
    expect(screen.getByText('240/240')).toBeInTheDocument()
  })

  it('posts and routes to home on success', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('chirper_token', 'token-123')

    server.use(
      http.post('/tweets', async ({ request }) => {
        const body = (await request.json()) as { text: string }
        if (body.text === 'hello world') {
          return HttpResponse.json({ id: 1 })
        }
        return HttpResponse.json({ detail: 'Bad request' }, { status: 400 })
      }),
      http.get('/feed', () => {
        return HttpResponse.json([])
      }),
    )

    render(
      <MemoryRouter initialEntries={['/compose']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText(/post text/i), 'hello world')
    await user.click(screen.getAllByRole('button', { name: /^post$/i }).at(-1)!)

    expect(await screen.findByRole('heading', { name: /home feed/i })).toBeInTheDocument()
  })

  it('shows inline error on 400 response', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('chirper_token', 'token-123')

    server.use(
      http.post('/tweets', () => {
        return HttpResponse.json({ detail: 'Tweet too long' }, { status: 400 })
      }),
    )

    render(
      <MemoryRouter initialEntries={['/compose']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText(/post text/i), 'hello world')
    await user.click(screen.getAllByRole('button', { name: /^post$/i }).at(-1)!)

    expect(await screen.findByRole('alert')).toHaveTextContent(/too long/i)
  })
})
