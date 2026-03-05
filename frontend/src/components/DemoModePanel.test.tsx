import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { jest } from '@jest/globals'
import { http, HttpResponse, delay } from 'msw'

import { server } from '../test/server'
import { DemoModePanel } from './DemoModePanel'
import { ToastProvider } from '../ui/toast'

describe('DemoModePanel', () => {
  beforeEach(() => {
    window.localStorage.clear()
    ;(globalThis as typeof globalThis & { __VITE_DEMO_SEED_SECRET__?: string }).__VITE_DEMO_SEED_SECRET__ =
      'demo-secret'
  })

  it('disables generate button while seeding and shows success toast', async () => {
    const user = userEvent.setup()
    const onSeeded = jest.fn()

    server.use(
      http.post('/dev/demo/seed', async () => {
        await delay(80)
        return HttpResponse.json({ users_created: 18, tweets_created: 108 })
      }),
    )

    render(
      <ToastProvider>
        <DemoModePanel onSeeded={onSeeded} />
      </ToastProvider>,
    )

    await user.click(screen.getByRole('button', { name: /demo mode off/i }))
    const generateButton = screen.getByRole('button', { name: /generate demo content/i })

    await user.click(generateButton)

    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled()
    expect(await screen.findByText(/demo content generated/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(onSeeded).toHaveBeenCalledTimes(1)
    })
  })
})
