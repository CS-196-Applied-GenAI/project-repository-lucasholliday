import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

export const server = setupServer(
  http.get('/auth/me', () => {
    return HttpResponse.json({ username: 'test-user', bio: null, profile_picture: null })
  }),
  http.get('/feed', () => {
    return HttpResponse.json([])
  }),
)
