import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'

import { AuthProvider } from '../auth/AuthContext'
import { AppRoutes } from '../routes/Router'
import { server } from '../test/server'

describe('HomeFeedPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem('chirper_token', 'token-123')
  })

  it('fetches feed on mount and renders tweets with loading state', async () => {
    server.use(
      http.get('/feed', ({ request }) => {
        const url = new URL(request.url)
        if (url.searchParams.get('limit') === '20' && url.searchParams.get('offset') === '0') {
          return HttpResponse.json([
            { id: 1, author_username: 'alice', text: 'first tweet' },
            { id: 2, author_username: 'bob', text: 'second tweet' },
          ])
        }
        return HttpResponse.json([], { status: 400 })
      }),
    )

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument()
    expect(await screen.findByText(/first tweet/i)).toBeInTheDocument()
    expect(await screen.findByText(/second tweet/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument()
    })
  })

  it('supports backend feed shape { items: [...] } without crashing', async () => {
    server.use(
      http.get('/feed', () => {
        return HttpResponse.json({
          items: [{ tweet_id: 101, author_username: 'alice', text: 'from items shape', is_liked_by_me: true }],
        })
      }),
    )

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/from items shape/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /unlike/i })).toBeInTheDocument()
  })

  it('shows empty-state message when feed is empty', async () => {
    server.use(
      http.get('/feed', () => {
        return HttpResponse.json([])
      }),
    )

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/no posts yet/i)).toBeInTheDocument()
  })

  it('refresh re-fetches first page and replaces tweet list', async () => {
    const user = userEvent.setup()
    let calls = 0

    server.use(
      http.get('/feed', ({ request }) => {
        const url = new URL(request.url)
        if (url.searchParams.get('offset') !== '0') {
          return HttpResponse.json([], { status: 400 })
        }

        calls += 1
        if (calls === 1) {
          return HttpResponse.json([{ id: 1, author_username: 'alice', text: 'tweet A' }])
        }

        return HttpResponse.json([{ id: 2, author_username: 'bob', text: 'tweet B' }])
      }),
    )

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/tweet a/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /refresh/i }))

    expect(await screen.findByText(/tweet b/i)).toBeInTheDocument()
    expect(screen.queryByText(/tweet a/i)).not.toBeInTheDocument()
  })

  it('load more appends tweets from next offset', async () => {
    const user = userEvent.setup()

    server.use(
      http.get('/feed', ({ request }) => {
        const url = new URL(request.url)
        const offset = url.searchParams.get('offset')

        if (offset === '0') {
          return HttpResponse.json([{ id: 1, author_username: 'alice', text: 'tweet A' }])
        }

        if (offset === '20') {
          return HttpResponse.json([{ id: 2, author_username: 'bob', text: 'tweet B' }])
        }

        return HttpResponse.json([])
      }),
    )

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/tweet a/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /load more/i }))

    expect(await screen.findByText(/tweet b/i)).toBeInTheDocument()
    expect(screen.getByText(/tweet a/i)).toBeInTheDocument()
  })

  it('clicking author navigates to user profile page', async () => {
    const user = userEvent.setup()

    server.use(
      http.get('/feed', () => {
        return HttpResponse.json([{ id: 1, author_username: 'alice', text: 'tweet from alice' }])
      }),
    )

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    await user.click(await screen.findByRole('link', { name: /alice/i }))

    expect(await screen.findByRole('heading', { name: /profile:\s*alice/i })).toBeInTheDocument()
  })

  it('view replies action navigates to replies page', async () => {
    const user = userEvent.setup()

    server.use(
      http.get('/feed', () => {
        return HttpResponse.json([{ id: 11, author_username: 'alice', text: 'tweet with reply button' }])
      }),
    )

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    await user.click(await screen.findByRole('button', { name: /view replies/i }))
    expect(await screen.findByRole('heading', { name: /replies for tweet 11/i })).toBeInTheDocument()
  })

  it('shows delete for own tweets and removes tweet on success', async () => {
    const user = userEvent.setup()
    let deleteCalls = 0

    server.use(
      http.get('/auth/me', () => {
        return HttpResponse.json({ username: 'lucas', bio: null, profile_picture: null })
      }),
      http.get('/feed', () => {
        return HttpResponse.json([{ id: 1, author_username: 'lucas', text: 'my tweet' }])
      }),
      http.delete('/tweets/1', () => {
        deleteCalls += 1
        return HttpResponse.json({ ok: true })
      }),
    )

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/my tweet/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(screen.queryByText(/my tweet/i)).not.toBeInTheDocument()
    })
    expect(deleteCalls).toBe(1)
  })

  it('does not show delete for tweets authored by other users', async () => {
    server.use(
      http.get('/auth/me', () => {
        return HttpResponse.json({ username: 'lucas', bio: null, profile_picture: null })
      }),
      http.get('/feed', () => {
        return HttpResponse.json([{ id: 1, author_username: 'alice', text: 'not mine' }])
      }),
    )

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/not mine/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })
})
