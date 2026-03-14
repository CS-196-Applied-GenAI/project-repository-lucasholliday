import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react'

import { ApiError, apiFetch } from '../api/client'
import { createLocalPost, createLocalReply, createLocalRepost, type FeedApiItem, type FeedPost, mergePosts, normalizeFeedItem, normalizeFeedResponse, type FeedResponse, toPostKey } from './postModel'

const PAGE_SIZE = 20

type FeedContextValue = {
  items: FeedPost[]
  loading: boolean
  loaded: boolean
  error: string | null
  loadFeed: (nextOffset?: number, mode?: 'replace' | 'append') => Promise<void>
  refreshFeed: () => Promise<void>
  loadMore: () => Promise<void>
  prependCreatedPost: (post: { id: number | string; authorUsername: string; text: string }) => void
  prependReply: (post: { id: number | string; authorUsername: string; text: string; replyToUsername?: string | null }) => void
  prependRepost: (post: { id: number | string; authorUsername: string; originalPost: FeedPost }) => void
  removeRepost: (post: { repostId?: number | string; originalPostId: number | string; authorUsername?: string }) => void
  removePost: (id: number | string) => void
  getPostById: (id: number | string) => FeedPost | undefined
  ensurePost: (id: number | string) => Promise<FeedPost | undefined>
  attachOriginalPost: (postId: number | string, originalPost: FeedPost) => void
  updatePost: (id: number | string, updater: (current: FeedPost) => FeedPost) => void
}

const FeedContext = createContext<FeedContextValue | undefined>(undefined)

export function FeedProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<FeedPost[]>([])
  const [postCache, setPostCache] = useState<Record<string, FeedPost>>({})
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cachePosts = useCallback((posts: FeedPost[]) => {
    if (posts.length === 0) return
    setPostCache((current) => {
      const next = { ...current }
      for (const post of posts) {
        next[toPostKey(post.id)] = post
        if (post.originalPost) {
          next[toPostKey(post.originalPost.id)] = post.originalPost
        }
      }
      return next
    })
  }, [])

  const loadFeed = useCallback(async (nextOffset = 0, mode: 'replace' | 'append' = 'replace') => {
    setLoading(true)
    try {
      setError(null)
      const payload = await apiFetch<FeedResponse>(`/feed?limit=${PAGE_SIZE}&offset=${nextOffset}`)
      const serverItems = normalizeFeedResponse(payload)
      cachePosts(serverItems)
      setItems((current) => {
        if (mode === 'replace') {
          const localItems = current.filter((post) => post.source === 'local')
          return mergePosts(localItems, serverItems)
        }
        return mergePosts(current, serverItems)
      })
      setOffset(nextOffset)
      setLoaded(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load feed')
      if (mode === 'replace') {
        setItems((current) => current.filter((post) => post.source === 'local'))
      }
    } finally {
      setLoading(false)
    }
  }, [cachePosts])

  const refreshFeed = useCallback(async () => {
    await loadFeed(0, 'replace')
  }, [loadFeed])

  const loadMore = useCallback(async () => {
    await loadFeed(offset + PAGE_SIZE, 'append')
  }, [loadFeed, offset])

  const prependCreatedPost = useCallback((post: { id: number | string; authorUsername: string; text: string }) => {
    const created = createLocalPost(post)
    cachePosts([created])
    setItems((current) => [created, ...current.filter((item) => toPostKey(item.id) !== toPostKey(created.id))])
  }, [cachePosts])

  const prependReply = useCallback((post: { id: number | string; authorUsername: string; text: string; replyToUsername?: string | null }) => {
    const reply = createLocalReply(post)
    cachePosts([reply])
    setItems((current) => [reply, ...current.filter((item) => toPostKey(item.id) !== toPostKey(reply.id))])
  }, [cachePosts])

  const prependRepost = useCallback((post: { id: number | string; authorUsername: string; originalPost: FeedPost }) => {
    const repost = createLocalRepost(post)
    cachePosts([post.originalPost, repost])
    setItems((current) => [
      repost,
      ...current.filter(
        (item) =>
          toPostKey(item.id) !== toPostKey(repost.id)
          && !(item.kind === 'repost'
            && item.authorUsername === repost.authorUsername
            && item.originalPostId
            && toPostKey(item.originalPostId) === toPostKey(repost.originalPostId!)),
      ),
    ])
  }, [cachePosts])

  const removeRepost = useCallback((post: { repostId?: number | string; originalPostId: number | string; authorUsername?: string }) => {
    setItems((current) =>
      current.filter((item) => {
        if (post.repostId !== undefined && toPostKey(item.id) === toPostKey(post.repostId)) {
          return false
        }
        if (item.kind !== 'repost' || !item.originalPostId) return true
        if (toPostKey(item.originalPostId) !== toPostKey(post.originalPostId)) return true
        if (post.authorUsername && item.authorUsername !== post.authorUsername) return true
        return false
      }),
    )
  }, [])

  const removePost = useCallback((id: number | string) => {
    setItems((current) => current.filter((item) => toPostKey(item.id) !== toPostKey(id)))
    setPostCache((current) => {
      const next = { ...current }
      delete next[toPostKey(id)]
      return next
    })
  }, [])

  const getPostById = useCallback((id: number | string) => {
    const key = toPostKey(id)
    return items.find((item) => toPostKey(item.id) === key) ?? postCache[key]
  }, [items, postCache])

  const attachOriginalPost = useCallback((postId: number | string, originalPost: FeedPost) => {
    cachePosts([originalPost])
    setItems((current) =>
      current.map((item) =>
        toPostKey(item.id) === toPostKey(postId)
          ? { ...item, originalPost }
          : item,
      ),
    )
    setPostCache((current) => {
      const key = toPostKey(postId)
      const post = current[key]
      if (!post) return current
      return {
        ...current,
        [key]: {
          ...post,
          originalPost,
        },
      }
    })
  }, [cachePosts])

  const updatePost = useCallback((id: number | string, updater: (current: FeedPost) => FeedPost) => {
    const key = toPostKey(id)
    setItems((current) =>
      current.map((item) => {
        if (toPostKey(item.id) === key) {
          return updater(item)
        }
        if (item.originalPost && toPostKey(item.originalPost.id) === key) {
          return {
            ...item,
            originalPost: updater(item.originalPost),
          }
        }
        return item
      }),
    )
    setPostCache((current) => {
      const target = current[key]
      if (!target) return current
      return {
        ...current,
        [key]: updater(target),
      }
    })
  }, [])

  const ensurePost = useCallback(async (id: number | string) => {
    const resolvePost = async (targetId: number | string): Promise<FeedPost | undefined> => {
      const key = toPostKey(targetId)
      const cached = items.find((item) => toPostKey(item.id) === key) ?? postCache[key]
      if (cached) {
        if (cached.kind === 'repost' && cached.originalPostId && !cached.originalPost) {
          const original = await resolvePost(cached.originalPostId)
          if (original) {
            attachOriginalPost(cached.id, original)
            return { ...cached, originalPost: original }
          }
        }
        return cached
      }

      try {
        const payload = await apiFetch<FeedApiItem>(`/tweets/${targetId}`)
        const normalized = normalizeFeedItem(payload)
        if (!normalized) return undefined
        cachePosts([normalized])
        if (normalized.kind === 'repost' && normalized.originalPostId) {
          const original = await resolvePost(normalized.originalPostId)
          if (original) {
            const enriched = { ...normalized, originalPost: original }
            cachePosts([enriched])
            return enriched
          }
        }
        return normalized
      } catch {
        return undefined
      }
    }

    return resolvePost(id)
  }, [attachOriginalPost, cachePosts, items, postCache])

  const value = useMemo<FeedContextValue>(() => ({
    items,
    loading,
    loaded,
    error,
    loadFeed,
    refreshFeed,
    loadMore,
    prependCreatedPost,
    prependReply,
    prependRepost,
    removeRepost,
    removePost,
    getPostById,
    ensurePost,
    attachOriginalPost,
    updatePost,
  }), [items, loading, loaded, error, loadFeed, refreshFeed, loadMore, prependCreatedPost, prependReply, prependRepost, removeRepost, removePost, getPostById, ensurePost, attachOriginalPost, updatePost])

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>
}

export function useFeed() {
  const context = useContext(FeedContext)
  if (!context) {
    throw new Error('useFeed must be used inside FeedProvider')
  }
  return context
}
