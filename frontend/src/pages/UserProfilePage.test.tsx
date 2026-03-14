import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'

import { AuthProvider } from '../auth/AuthContext'
import { AppRoutes } from '../routes/Router'
import { server } from '../test/server'

describe('UserProfilePage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem('chirper_token', 'token-123')
  })

  it('renders username from route param', async () => {
    render(
      <MemoryRouter initialEntries={['/u/alice']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('@alice')).toBeInTheDocument()
    expect(screen.getByText(/^posts$/i)).toBeInTheDocument()
  })

  it('follow and unfollow toggle calls endpoints and updates button text', async () => {
    const user = userEvent.setup()
    let followCalls = 0
    let unfollowCalls = 0

    server.use(
      http.post('/users/alice/follow', () => {
        followCalls += 1
        return HttpResponse.json({ ok: true })
      }),
      http.delete('/users/alice/follow', () => {
        unfollowCalls += 1
        return HttpResponse.json({ ok: true })
      }),
    )

    render(
      <MemoryRouter initialEntries={['/u/alice']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    await user.click(await screen.findByRole('button', { name: /^follow$/i }))
    expect(await screen.findByRole('button', { name: /unfollow/i })).toBeInTheDocument()
    expect(followCalls).toBe(1)

    await user.click(screen.getByRole('button', { name: /unfollow/i }))
    expect(await screen.findByRole('button', { name: /^follow$/i })).toBeInTheDocument()
    expect(unfollowCalls).toBe(1)
  })

  it('block and unblock toggle updates blocked-state UI', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('/users/alice/block', () => {
        return HttpResponse.json({ ok: true })
      }),
      http.delete('/users/alice/block', () => {
        return HttpResponse.json({ ok: true })
      }),
    )

    render(
      <MemoryRouter initialEntries={['/u/alice']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    await user.click(await screen.findByRole('button', { name: /^block$/i }))
    expect(await screen.findByText(/this profile is hidden\./i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^follow$/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /unblock/i }))
    expect(screen.queryByText(/this profile is hidden\./i)).not.toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /^follow$/i })).toBeInTheDocument()
  })

  it('shows "User not found" when follow action returns 404', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('/users/alice/follow', () => {
        return HttpResponse.json({ detail: 'Not found' }, { status: 404 })
      }),
    )

    render(
      <MemoryRouter initialEntries={['/u/alice']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    await user.click(await screen.findByRole('button', { name: /^follow$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/user not found/i)
  })

  it('shows "Action not allowed" when block action returns 403', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('/users/alice/block', () => {
        return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
      }),
    )

    render(
      <MemoryRouter initialEntries={['/u/alice']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    await user.click(await screen.findByRole('button', { name: /^block$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/action not allowed/i)
  })
})
