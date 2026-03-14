import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

import { HealthDemo } from './HealthDemo'
import { server } from '../test/server'

describe('HealthDemo', () => {
  it('renders mocked health response', async () => {
    server.use(
      http.get('/health', () => {
        return HttpResponse.json({ status: 'ok' })
      }),
    )

    render(<HealthDemo />)

    expect(await screen.findByText('Health: ok')).toBeInTheDocument()
  })
})
