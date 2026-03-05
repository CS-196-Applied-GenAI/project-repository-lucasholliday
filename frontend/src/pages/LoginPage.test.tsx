import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'

import { AuthProvider } from '../auth/AuthContext'
import { AppRoutes } from '../routes/Router'
import { getToken } from '../storage/token'
import { server } from '../test/server'

describe('LoginPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders username, password, and submit button', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create account/i })).toHaveAttribute('href', '/register')
  })

  it('stores token and navigates to /home on successful login', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('/auth/login', async ({ request }) => {
        const body = (await request.json()) as { username: string; password: string }
        if (body.username === 'lucas' && body.password === 'Password1') {
          return HttpResponse.json({ token: 'jwt-token-123' })
        }
        return HttpResponse.json({ detail: 'Bad credentials' }, { status: 401 })
      }),
      http.get('/auth/me', () => {
        return HttpResponse.json({ username: 'lucas', bio: null, profile_picture: null })
      }),
    )

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText(/username/i), 'lucas')
    await user.type(screen.getByLabelText(/password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('heading', { name: /home feed/i })).toBeInTheDocument()
    expect(await screen.findByText(/signed in as lucas/i)).toBeInTheDocument()
    expect(getToken()).toBe('jwt-token-123')
  })

  it('shows inline invalid credentials message on 401', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('/auth/login', () => {
        return HttpResponse.json({ detail: 'Bad credentials' }, { status: 401 })
      }),
    )

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText(/username/i), 'lucas')
    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid username\/password/i)
  })

  it('clears prior error when user edits username after failed login', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('/auth/login', () => {
        return HttpResponse.json({ detail: 'Bad credentials' }, { status: 401 })
      }),
    )

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText(/username/i), 'lucas')
    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid username\/password/i)

    await user.type(screen.getByLabelText(/username/i), 'x')

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
