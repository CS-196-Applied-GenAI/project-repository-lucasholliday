import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { AuthProvider } from '../auth/AuthContext'
import { AppRoutes } from '../routes/Router'
import { addReply } from '../storage/repliesStore'

describe('RepliesPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem('chirper_token', 'token-123')
  })

  it('renders stored replies and links to reply page', async () => {
    const user = userEvent.setup()

    addReply('1', {
      id: 'r1',
      author_username: 'alice',
      text: 'first reply',
      created_at: '2026-01-01T00:00:00.000Z',
    })
    addReply('1', {
      id: 'r2',
      author_username: 'bob',
      text: 'second reply',
      created_at: '2026-01-01T00:00:00.000Z',
    })

    render(
      <MemoryRouter initialEntries={['/tweet/1/replies']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/first reply/i)).toBeInTheDocument()
    expect(screen.getByText(/second reply/i)).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /reply/i }))
    expect((await screen.findAllByRole('heading', { name: /^reply$/i })).length).toBeGreaterThan(0)
  })
})
