import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'

import { AuthProvider } from '../auth/AuthContext'
import { AppRoutes } from '../routes/Router'
import { server } from '../test/server'

describe('DiscoverPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem('chirper_token', 'token-123')
  })

  it('searches users and renders profile links', async () => {
    const user = userEvent.setup()

    server.use(
      http.get('/users/search', ({ request }) => {
        const url = new URL(request.url)
        if (url.searchParams.get('q') === 'demo') {
          return HttpResponse.json({ items: [{ username: 'demoaccount' }, { username: 'demouser' }] })
        }
        return HttpResponse.json({ items: [] })
      }),
    )

    render(
      <MemoryRouter initialEntries={['/discover']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText(/^explore$/i), 'demo')
    await user.click(screen.getByRole('button', { name: /^explore$/i }))

    expect(await screen.findByRole('link', { name: /@demoaccount/i })).toHaveAttribute('href', '/u/demoaccount')
    expect(screen.getByRole('link', { name: /@demouser/i })).toHaveAttribute('href', '/u/demouser')
  })
})
