type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

import { getToken } from '../storage/token'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let unauthorizedHandler: (() => void) | undefined

export function setApiUnauthorizedHandler(handler: (() => void) | undefined): void {
  unauthorizedHandler = handler
}

function getBaseUrl(): string {
  const testBase = (globalThis as typeof globalThis & { __VITE_API_BASE_URL__?: string }).__VITE_API_BASE_URL__
  if (testBase) return testBase

  const fromEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_API_BASE_URL
  return fromEnv ?? ''
}

function normalizePath(path: string): string {
  if (!path.startsWith('/')) return `/${path}`
  return path
}

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const url = `${getBaseUrl()}${normalizePath(path)}`
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let body = options.body
  if (body !== undefined && body !== null) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(body)
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: body as BodyInit | null | undefined,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')

  if (isJson) {
    const data = (await response.json()) as T
    if (!response.ok) {
      const errorPayload = data as unknown as { detail?: string; message?: string }
      const message = errorPayload.detail ?? errorPayload.message ?? `Request failed with status ${response.status}`
      if (response.status === 401) {
        unauthorizedHandler?.()
      }
      throw new ApiError(response.status, message)
    }
    return data
  }

  if (!response.ok) {
    if (response.status === 401) {
      unauthorizedHandler?.()
    }
    throw new ApiError(response.status, `Request failed with status ${response.status}`)
  }

  return undefined as T
}
