import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'

import { AuthProvider } from './AuthContext'
import { AppRoutes } from '../routes/Router'
import { server } from '../test/server'

describe('auth bootstrap 401', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('clears token and redirects to login when /auth/me returns 401', async () => {
    window.localStorage.setItem('chirper_token', 'token-123')

    server.use(
      http.get('/auth/me', () => {
        return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 })
      }),
    )

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/home']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(await screen.findByRole('heading', { name: /login/i })).toBeInTheDocument()
    expect(window.localStorage.getItem('chirper_token')).toBeNull()
  })
})
