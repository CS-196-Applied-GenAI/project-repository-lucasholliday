import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

export const server = setupServer(
  http.get('/auth/me', () => {
    return HttpResponse.json({ username: 'test-user', bio: null, profile_picture: null })
  }),
  http.get('/users/me', () => {
    return HttpResponse.json({
      username: 'test-user',
      bio: null,
      profile_picture: null,
      follower_count: 0,
      following_count: 0,
      posts: [],
    })
  }),
  http.get('/users/:username', ({ params }) => {
    return HttpResponse.json({
      username: String(params.username),
      bio: null,
      profile_picture: null,
      follower_count: 0,
      following_count: 0,
      posts: [],
    })
  }),
  http.get('/feed', () => {
    return HttpResponse.json([])
  }),
  http.get('/tweets/:tweetId', ({ params }) => {
    return HttpResponse.json({
      tweet_id: Number(params.tweetId),
      author_username: 'alice',
      text: 'Sample post',
      created_at: new Date().toISOString(),
      retweeted_from: null,
      like_count: 0,
      is_liked_by_me: false,
    })
  }),
)
