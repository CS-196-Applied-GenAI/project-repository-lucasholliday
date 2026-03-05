import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'

import { AppRoutes } from '../routes/Router'
import { server } from '../test/server'
import { AuthProvider } from './AuthContext'
import { IDLE_TIMEOUT_MS } from './IdleTimerProvider'

describe('IdleTimerProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    window.localStorage.clear()
    window.localStorage.setItem('chirper_token', 'token-123')
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('logs out and redirects to login after idle timeout', async () => {
    let logoutCalls = 0
    server.use(
      http.post('/auth/logout', () => {
        logoutCalls += 1
        return HttpResponse.json({ ok: true })
      }),
    )

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    await act(async () => {
      jest.advanceTimersByTime(IDLE_TIMEOUT_MS)
    })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
    })
    expect(logoutCalls).toBe(1)
  })

  it('resets the timer when activity occurs', async () => {
    server.use(
      http.post('/auth/logout', () => {
        return HttpResponse.json({ ok: true })
      }),
    )

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>,
    )

    await act(async () => {
      jest.advanceTimersByTime(IDLE_TIMEOUT_MS - 1000)
    })

    fireEvent.mouseMove(window)

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(screen.queryByRole('heading', { name: /login/i })).not.toBeInTheDocument()

    await act(async () => {
      jest.advanceTimersByTime(IDLE_TIMEOUT_MS)
    })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
    })
  })
})
