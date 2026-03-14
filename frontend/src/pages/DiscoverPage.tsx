import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { apiFetch } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { TextField } from '../ui/TextField'
import { useToast } from '../ui/toast'

const SUGGESTED_USERNAMES = ['wildcatfan', 'northwesterngrad', 'evanstonsports', 'campusreport']

type SearchResult = {
  username: string
}

export function DiscoverPage() {
  const { me } = useAuth()
  const { pushToast } = useToast()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const usernames = SUGGESTED_USERNAMES.filter((name) => name !== me?.username)

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = query.trim()
    if (!q) {
      setResults([])
      setError(null)
      return
    }

    setIsSearching(true)
    setError(null)
    try {
      const payload = await apiFetch<{ items: SearchResult[] }>(`/users/search?q=${encodeURIComponent(q)}&limit=12`)
      setResults(payload.items)
      if (payload.items.length === 0) {
        pushToast('No users found for this search', 'info')
      }
    } catch {
      setError('Search failed')
      pushToast('Could not search users', 'error')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <main className='space-y-5'>
      <Card className='p-5'>
        <p className='text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-300)]'>Explore</p>
        <h1 className='mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)]'>Explore</h1>
        <p className='mt-2 text-sm leading-6 text-[var(--text-secondary)]'>Find people and communities to follow.</p>
      </Card>

      <Card as='form' onSubmit={onSearch} className='p-5'>
        <div className='mt-2 flex gap-2'>
          <TextField
            id='discover-search'
            label='Explore'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Find by username'
            className='w-full'
          />
          <Button type='submit' disabled={isSearching} className='self-end'>
            Explore
          </Button>
        </div>
        {error ? <p role='alert' className='mt-2 text-sm text-red-300'>{error}</p> : null}
      </Card>

      {results.length > 0 ? (
        <Card as='section' className='p-5'>
          <h2 className='text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-300)]'>Profiles</h2>
          <ul className='mt-3 grid gap-2 md:grid-cols-2'>
            {results.map((item) => (
              <li key={item.username}>
                <Link
                  to={`/u/${item.username}`}
                  className='focus-ring block rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[color:var(--bg-layer-3)]/65 px-3 py-2 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--accent-500)] hover:bg-[var(--accent-glow)]'
                >
                  @{item.username}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <section className='grid gap-3 md:grid-cols-2'>
        {usernames.map((username) => (
          <Card key={username} as='article' className='p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]'>
            <p className='text-sm uppercase tracking-[0.16em] text-[var(--accent-300)]'>Suggested</p>
            <p className='mt-2 text-lg font-semibold text-[var(--text-primary)]'>@{username}</p>
            <p className='mt-2 text-sm leading-6 text-[var(--text-secondary)]'>Open this profile to see posts and connections.</p>
            <Link
              to={`/u/${username}`}
              className='focus-ring mt-4 inline-flex rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[color:var(--bg-layer-3)]/60 px-3 py-2 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--accent-500)] hover:bg-[var(--accent-glow)]'
            >
              Open
            </Link>
          </Card>
        ))}
      </section>
    </main>
  )
}
