import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { AuthProvider } from '../auth/AuthContext'
import { AppRoutes } from './Router'

describe('Router', () => {
  it('renders Login page at /login', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
  })

  it('renders Register page at /register', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/register']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
  })

  it('renders not found page for unknown paths', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/something/missing']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /go to login/i })).toHaveAttribute('href', '/login')
  })
})
