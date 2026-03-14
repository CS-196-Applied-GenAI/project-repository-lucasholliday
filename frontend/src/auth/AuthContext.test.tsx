import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AuthProvider } from './AuthContext'
import { useAuth } from './useAuth'

function Harness() {
  const { isAuthenticated, login, logout } = useAuth()

  return (
    <div>
      <p>{isAuthenticated ? 'authenticated' : 'anonymous'}</p>
      <button onClick={() => login('token-xyz')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('login sets authenticated state', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    )

    expect(screen.getByText('anonymous')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /login/i }))
    expect(screen.getByText('authenticated')).toBeInTheDocument()
  })

  it('logout clears authenticated state', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    )

    await user.click(screen.getByRole('button', { name: /login/i }))
    expect(screen.getByText('authenticated')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /logout/i }))
    expect(screen.getByText('anonymous')).toBeInTheDocument()
  })
})
