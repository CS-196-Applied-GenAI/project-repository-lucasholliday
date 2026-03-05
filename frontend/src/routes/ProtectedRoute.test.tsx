import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { AuthProvider } from '../auth/AuthContext'
import { AppRoutes } from './Router'

describe('ProtectedRoute (stub auth)', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('redirects /home to /login when token missing', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/home']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
  })

  it('renders /home when token exists', () => {
    window.localStorage.setItem('chirper_token', 'token-123')

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/home']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(screen.getByRole('heading', { name: /home feed/i })).toBeInTheDocument()
  })

  it('renders username in /u/:username route when authenticated', () => {
    window.localStorage.setItem('chirper_token', 'token-123')

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/u/someuser']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(screen.getByRole('heading', { name: /profile:\s*someuser/i })).toBeInTheDocument()
  })
})
