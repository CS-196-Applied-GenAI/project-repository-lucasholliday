import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { AuthProvider } from '../auth/AuthContext'
import { AppRoutes } from '../routes/Router'

describe('PostReplyPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem('chirper_token', 'token-123')
  })

  it('saves reply and navigates to replies page', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/tweet/1/reply']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText(/reply text/i), 'this is my reply')
    await user.click(screen.getByRole('button', { name: /post reply/i }))

    expect(await screen.findByRole('heading', { name: /replies for tweet 1/i })).toBeInTheDocument()
    expect(screen.getByText(/this is my reply/i)).toBeInTheDocument()
  })
})
