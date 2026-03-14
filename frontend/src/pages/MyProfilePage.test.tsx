import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'

import { AuthProvider } from '../auth/AuthContext'
import { AppRoutes } from '../routes/Router'
import { server } from '../test/server'

describe('MyProfilePage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem('chirper_token', 'token-123')
  })

  it('shows me data and fallback bio text on /profile', async () => {
    server.use(
      http.get('/auth/me', () => {
        return HttpResponse.json({ username: 'lucas', bio: null, profile_picture: null })
      }),
      http.get('/feed', () => {
        return HttpResponse.json([])
      }),
    )

    render(
      <MemoryRouter initialEntries={['/profile']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: /my profile/i })).toBeInTheDocument()
    expect(await screen.findByText('lucas')).toBeInTheDocument()
    expect(screen.getByText('No bio')).toBeInTheDocument()
  })

  it('updates bio via PATCH /users/me and reflects updated profile data', async () => {
    const user = userEvent.setup()

    server.use(
      http.get('/auth/me', () => {
        return HttpResponse.json({ username: 'lucas', bio: null, profile_picture: null })
      }),
      http.patch('/users/me', async ({ request }) => {
        const body = (await request.json()) as { username: string; bio: string; profile_picture: string }
        return HttpResponse.json({
          username: body.username,
          bio: body.bio,
          profile_picture: body.profile_picture || null,
        })
      }),
    )

    render(
      <MemoryRouter initialEntries={['/profile']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: /my profile/i })

    const bioInput = screen.getByLabelText(/bio/i)
    await user.clear(bioInput)
    await user.type(bioInput, 'new bio text')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(await screen.findByText(/new bio text/i)).toBeInTheDocument()
  })
})
