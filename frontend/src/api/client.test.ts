import { jest } from '@jest/globals'

import { clearToken, setToken } from '../storage/token'
import { apiFetch, setApiUnauthorizedHandler } from './client'

describe('apiFetch', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    clearToken()
    ;(global as typeof globalThis & { __VITE_API_BASE_URL__?: string }).__VITE_API_BASE_URL__ =
      'http://localhost:8000'
  })

  afterEach(() => {
    global.fetch = originalFetch
    setApiUnauthorizedHandler(undefined)
    jest.restoreAllMocks()
  })

  it('calls the right URL', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
      text: async () => JSON.stringify({ status: 'ok' }),
      headers: new Headers({ 'content-type': 'application/json' }),
    } as Response)

    await apiFetch('/health')

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/health', expect.any(Object))
  })

  it('json stringifies body and sets content-type', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: 'abc' }),
      text: async () => JSON.stringify({ token: 'abc' }),
      headers: new Headers({ 'content-type': 'application/json' }),
    } as Response)

    await apiFetch('/auth/login', {
      method: 'POST',
      body: { username: 'lucas', password: 'Abcdefg1' },
    })

    const secondArg = fetchMock.mock.calls[0][1] as RequestInit
    expect(secondArg.body).toBe(JSON.stringify({ username: 'lucas', password: 'Abcdefg1' }))
    expect(secondArg.headers).toEqual(
      expect.objectContaining({
        'Content-Type': 'application/json',
      }),
    )
  })

  it('parses JSON responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'hello' }),
      text: async () => JSON.stringify({ message: 'hello' }),
      headers: new Headers({ 'content-type': 'application/json' }),
    } as Response)

    const result = await apiFetch<{ message: string }>('/health')

    expect(result).toEqual({ message: 'hello' })
  })

  it('adds Authorization header when token exists', async () => {
    setToken('jwt-token')

    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
      text: async () => JSON.stringify({ status: 'ok' }),
      headers: new Headers({ 'content-type': 'application/json' }),
    } as Response)

    await apiFetch('/auth/me')

    const secondArg = fetchMock.mock.calls[0][1] as RequestInit
    expect(secondArg.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer jwt-token',
      }),
    )
  })

  it('does not add Authorization header when token missing', async () => {
    clearToken()

    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
      text: async () => JSON.stringify({ status: 'ok' }),
      headers: new Headers({ 'content-type': 'application/json' }),
    } as Response)

    await apiFetch('/health')

    const secondArg = fetchMock.mock.calls[0][1] as RequestInit
    expect(secondArg.headers).not.toEqual(expect.objectContaining({ Authorization: expect.any(String) }))
  })

  it('throws ApiError with JSON message for 400 responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'Invalid payload' }),
      text: async () => JSON.stringify({ detail: 'Invalid payload' }),
      headers: new Headers({ 'content-type': 'application/json' }),
    } as Response)

    await expect(apiFetch('/tweets')).rejects.toEqual(
      expect.objectContaining({
        status: 400,
        message: 'Invalid payload',
      }),
    )
  })

  it('throws fallback ApiError for non-JSON 404 responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => {
        throw new Error('not json')
      },
      text: async () => 'Not Found',
      headers: new Headers({ 'content-type': 'text/plain' }),
    } as unknown as Response)

    await expect(apiFetch('/missing')).rejects.toEqual(
      expect.objectContaining({
        status: 404,
        message: 'Request failed with status 404',
      }),
    )
  })

  it('calls unauthorized handler on 401', async () => {
    const unauthorizedSpy = jest.fn()
    setApiUnauthorizedHandler(unauthorizedSpy)

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Not authenticated' }),
      text: async () => JSON.stringify({ detail: 'Not authenticated' }),
      headers: new Headers({ 'content-type': 'application/json' }),
    } as Response)

    await expect(apiFetch('/auth/me')).rejects.toEqual(
      expect.objectContaining({
        status: 401,
      }),
    )
    expect(unauthorizedSpy).toHaveBeenCalledTimes(1)
  })
})
