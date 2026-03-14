const REPLIES_KEY = 'chirper_replies'

export type Reply = {
  id: string
  author_username: string
  text: string
  created_at: string
  reply_to_username?: string | null
}

type RepliesByTweet = Record<string, Reply[]>

function readStore(): RepliesByTweet {
  const raw = window.localStorage.getItem(REPLIES_KEY)
  if (!raw) return {}

  try {
    return JSON.parse(raw) as RepliesByTweet
  } catch {
    return {}
  }
}

function writeStore(store: RepliesByTweet): void {
  window.localStorage.setItem(REPLIES_KEY, JSON.stringify(store))
}

export function getReplies(tweetId: string): Reply[] {
  const store = readStore()
  return store[tweetId] ?? []
}

export function addReply(tweetId: string, reply: Reply): void {
  const store = readStore()
  const current = store[tweetId] ?? []
  store[tweetId] = [...current, reply]
  writeStore(store)
}
