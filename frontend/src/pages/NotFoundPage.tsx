import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'

export function NotFoundPage() {
  return (
    <main className='layout-container flex min-h-screen items-center justify-center py-12'>
      <Card className='w-full max-w-xl p-8 text-center'>
        <h1 className='text-3xl font-semibold text-[var(--accent-300)]'>Page not found</h1>
        <p className='mt-3 text-[var(--text-secondary)]'>The route you requested does not exist.</p>
        <Link
          className='focus-ring mt-6 inline-block rounded-full border border-[var(--border-strong)] px-5 py-2 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--accent-500)] hover:bg-[var(--accent-glow)]'
          to='/login'
        >
          Go to Login
        </Link>
      </Card>
    </main>
  )
}
