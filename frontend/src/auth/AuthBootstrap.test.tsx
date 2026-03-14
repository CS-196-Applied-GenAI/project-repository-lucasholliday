import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'

import { AuthProvider } from './AuthContext'
import { AppRoutes } from '../routes/Router'
import { server } from '../test/server'

describe('auth bootstrap /auth/me', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('loads me when token exists and shows username on protected page', async () => {
    window.localStorage.setItem('chirper_token', 'token-123')

    server.use(
      http.get('/auth/me', () => {
        return HttpResponse.json({ username: 'lucas', bio: null, profile_picture: null })
      }),
    )

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/home']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(await screen.findByText(/signed in as lucas/i)).toBeInTheDocument()
  })
})
