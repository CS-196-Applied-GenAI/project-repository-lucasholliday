import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'

import { AuthProvider } from '../auth/AuthContext'
import { AppRoutes } from '../routes/Router'
import { getToken } from '../storage/token'
import { server } from '../test/server'

describe('AppShell', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem('chirper_token', 'token-123')
  })

  it.each(['/home', '/compose', '/discover', '/profile'])('shows nav links on protected route %s', async (path) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('link', { name: /home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /compose/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /discover/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /my profile/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })

  it('logs out and redirects to login', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('/auth/logout', () => {
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

    await user.click(await screen.findByRole('button', { name: /logout/i }))

    expect(await screen.findByRole('heading', { name: /login/i })).toBeInTheDocument()
    expect(getToken()).toBeNull()
  })

  it('still logs out locally when /auth/logout fails', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('/auth/logout', () => {
        return HttpResponse.json({ detail: 'server error' }, { status: 500 })
      }),
    )

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    await user.click(await screen.findByRole('button', { name: /logout/i }))

    expect(await screen.findByRole('heading', { name: /login/i })).toBeInTheDocument()
    expect(getToken()).toBeNull()
  })

  it('navigates between Home, Compose, and My Profile via nav links', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: /home feed/i })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /compose/i }))
    expect(await screen.findByRole('heading', { name: /compose tweet/i })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /discover/i }))
    expect(await screen.findByRole('heading', { name: /discover accounts/i })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /my profile/i }))
    expect(await screen.findByRole('heading', { name: /my profile/i })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /home/i }))
    expect(await screen.findByRole('heading', { name: /home feed/i })).toBeInTheDocument()
  })

  it('shows nav on every required protected path', async () => {
    const paths = ['/home', '/compose', '/discover', '/profile', '/u/testuser', '/tweet/1/reply', '/tweet/1/replies']

    for (const path of paths) {
      render(
        <MemoryRouter initialEntries={[path]}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(await screen.findByRole('link', { name: /home/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /compose/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /discover/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /my profile/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()

      cleanup()
      window.localStorage.setItem('chirper_token', 'token-123')
    }
  })

  it('does not render removed sidebar quick-jump controls', async () => {
    render(
      <MemoryRouter initialEntries={['/home']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    await screen.findByRole('link', { name: /home/i })
    expect(screen.queryByLabelText(/open profile/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /go to user/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /write a post/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /search users/i })).not.toBeInTheDocument()
  })
})
