import { render, screen } from '@testing-library/react'

import App from './App'

describe('App', () => {
  it('renders login route on initial load', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
  })
})
