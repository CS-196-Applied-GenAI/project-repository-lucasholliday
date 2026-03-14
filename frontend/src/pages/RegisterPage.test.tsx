import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'

import { server } from '../test/server'
import { RegisterPage } from './RegisterPage'

function renderRegister() {
  render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/login' element={<h1>Login</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RegisterPage', () => {
  it('shows an inline error when confirm password does not match', async () => {
    const user = userEvent.setup()
    renderRegister()

    await user.type(screen.getByLabelText(/username/i), 'lucas')
    await user.type(screen.getByLabelText(/^password$/i), 'Password1')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password2')

    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/passwords do not match/i)
  })

  it('shows a back-to-login link', () => {
    renderRegister()
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login')
  })

  it('submits register and navigates to /login on success', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('/auth/register', async ({ request }) => {
        const body = (await request.json()) as { username: string; password: string }
        if (body.username === 'lucas' && body.password === 'Password1') {
          return HttpResponse.json({ ok: true })
        }
        return HttpResponse.json({ detail: 'Bad request' }, { status: 400 })
      }),
    )

    renderRegister()

    await user.type(screen.getByLabelText(/username/i), 'lucas')
    await user.type(screen.getByLabelText(/^password$/i), 'Password1')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1')

    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByRole('heading', { name: /login/i })).toBeInTheDocument()
  })

  it('shows username taken message on 409 conflict', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('/auth/register', () => {
        return HttpResponse.json({ detail: 'Username already taken' }, { status: 409 })
      }),
    )

    renderRegister()

    await user.type(screen.getByLabelText(/username/i), 'lucas')
    await user.type(screen.getByLabelText(/^password$/i), 'Password1')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1')

    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/username already taken/i)
  })
})
