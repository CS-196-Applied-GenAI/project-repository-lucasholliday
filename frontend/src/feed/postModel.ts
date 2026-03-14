export type PostKind = 'post' | 'reply' | 'repost'

export type FeedPost = {
  id: number | string
  authorUsername: string
  text: string
  createdAt?: string
  likeCount: number
  likedByMe: boolean
  repostedByMe: boolean
  kind: PostKind
  source: 'server' | 'local'
  originalPostId?: number | string | null
  originalPost?: FeedPost | null
  replyToUsername?: string | null
}

export type FeedApiItem = {
  id?: number | string
  tweet_id?: number | string
  author_username?: string
  text?: string
  created_at?: string
  retweeted_from?: number | string | null
  likeCount?: number
  like_count?: number
  likedByMe?: boolean
  is_liked_by_me?: boolean
  retweetedByMe?: boolean
  is_retweeted_by_me?: boolean
}

export type FeedResponse = FeedApiItem[] | { items?: FeedApiItem[] }

export function toPostKey(id: number | string) {
  return String(id)
}

export function normalizeFeedItem(item: FeedApiItem): FeedPost | null {
  const id = item.id ?? item.tweet_id
  if (id === undefined || id === null) return null
  if (!item.author_username) return null

  return {
    id,
    authorUsername: item.author_username,
    text: item.text ?? '',
    createdAt: item.created_at,
    likeCount: Number(item.likeCount ?? item.like_count ?? 0),
    likedByMe: Boolean(item.likedByMe ?? item.is_liked_by_me ?? false),
    repostedByMe: Boolean(item.retweetedByMe ?? item.is_retweeted_by_me ?? false),
    kind: item.retweeted_from ? 'repost' : 'post',
    source: 'server',
    originalPostId: item.retweeted_from ?? null,
    originalPost: null,
  }
}

export function normalizeFeedResponse(payload: FeedResponse): FeedPost[] {
  const rawItems = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : []
  return rawItems
    .map(normalizeFeedItem)
    .filter((post): post is FeedPost => post !== null)
}

export function mergePosts(primary: FeedPost[], secondary: FeedPost[]) {
  const seen = new Set<string>()
  const merged: FeedPost[] = []

  for (const post of [...primary, ...secondary]) {
    const key = toPostKey(post.id)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(post)
  }

  return merged
}

export function getActionTargetId(post: FeedPost) {
  return post.kind === 'repost' && post.originalPostId ? post.originalPostId : post.id
}

export function createLocalPost(post: {
  id: number | string
  authorUsername: string
  text: string
  createdAt?: string
}): FeedPost {
  return {
    id: post.id,
    authorUsername: post.authorUsername,
    text: post.text,
    createdAt: post.createdAt ?? new Date().toISOString(),
    likeCount: 0,
    likedByMe: false,
    repostedByMe: false,
    kind: 'post',
    source: 'local',
    originalPost: null,
    originalPostId: null,
    replyToUsername: null,
  }
}

export function createLocalReply(post: {
  id: number | string
  authorUsername: string
  text: string
  replyToUsername?: string | null
  createdAt?: string
}): FeedPost {
  return {
    id: post.id,
    authorUsername: post.authorUsername,
    text: post.text,
    createdAt: post.createdAt ?? new Date().toISOString(),
    likeCount: 0,
    likedByMe: false,
    repostedByMe: false,
    kind: 'reply',
    source: 'local',
    originalPost: null,
    originalPostId: null,
    replyToUsername: post.replyToUsername ?? null,
  }
}

export function createLocalRepost(post: {
  id: number | string
  authorUsername: string
  originalPost: FeedPost
  createdAt?: string
}): FeedPost {
  return {
    id: post.id,
    authorUsername: post.authorUsername,
    text: '',
    createdAt: post.createdAt ?? new Date().toISOString(),
    likeCount: 0,
    likedByMe: false,
    repostedByMe: true,
    kind: 'repost',
    source: 'local',
    originalPostId: post.originalPost.id,
    originalPost: post.originalPost,
    replyToUsername: null,
  }
}
