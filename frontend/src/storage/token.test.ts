import { clearToken, getToken, setToken } from './token'

describe('token storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('sets and gets token', () => {
    setToken('abc123')
    expect(getToken()).toBe('abc123')
  })

  it('returns null when token missing', () => {
    expect(getToken()).toBeNull()
  })

  it('clears token', () => {
    setToken('abc123')
    clearToken()
    expect(getToken()).toBeNull()
  })
})
