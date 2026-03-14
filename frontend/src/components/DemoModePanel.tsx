import { useMemo, useState } from 'react'

import { ApiError, apiFetch } from '../api/client'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useToast } from '../ui/toast'

const DEMO_MODE_STORAGE_KEY = 'chirper_demo_mode_enabled'

type DemoModePanelProps = {
  onSeeded?: () => void
}

function getDemoSeedSecret(): string {
  const globalSecret = (globalThis as typeof globalThis & { __VITE_DEMO_SEED_SECRET__?: string }).__VITE_DEMO_SEED_SECRET__
  if (globalSecret) return globalSecret

  const fromEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_DEMO_SEED_SECRET
  return fromEnv ?? ''
}

export function DemoModePanel({ onSeeded }: DemoModePanelProps) {
  const { pushToast } = useToast()
  const [isEnabled, setIsEnabled] = useState(() => window.localStorage.getItem(DEMO_MODE_STORAGE_KEY) === '1')
  const [isSeeding, setIsSeeding] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const demoSeedSecret = useMemo(() => getDemoSeedSecret(), [])
  const canCallDemoApi = demoSeedSecret.length > 0

  function onToggleDemoMode() {
    const next = !isEnabled
    setIsEnabled(next)
    if (next) {
      window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, '1')
    } else {
      window.localStorage.removeItem(DEMO_MODE_STORAGE_KEY)
    }
  }

  async function onGenerateDemoContent() {
    if (!canCallDemoApi) {
      pushToast('Action unavailable', 'error')
      return
    }

    try {
      setIsSeeding(true)
      await apiFetch('/dev/demo/seed', {
        method: 'POST',
        headers: {
          'X-Demo-Seed-Secret': demoSeedSecret,
        },
      })
      pushToast('Content refreshed.', 'success')
      onSeeded?.()
    } catch (err) {
      if (err instanceof ApiError) {
        pushToast(err.message || 'Action unavailable', 'error')
        return
      }
      pushToast('Action unavailable', 'error')
    } finally {
      setIsSeeding(false)
    }
  }

  async function onClearDemoContent() {
    if (!canCallDemoApi) {
      pushToast('Action unavailable', 'error')
      return
    }

    try {
      setIsClearing(true)
      await apiFetch('/dev/demo/seed', {
        method: 'DELETE',
        headers: {
          'X-Demo-Seed-Secret': demoSeedSecret,
        },
      })
      pushToast('Content cleared.', 'success')
      onSeeded?.()
    } catch (err) {
      if (err instanceof ApiError) {
        pushToast(err.message || 'Action unavailable', 'error')
        return
      }
      pushToast('Action unavailable', 'error')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <Card className='mt-5 p-3'>
      <div className='flex items-center justify-between gap-2'>
        <p className='text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-300)]'>Content tools</p>
        <Button type='button' size='sm' variant={isEnabled ? 'primary' : 'secondary'} onClick={onToggleDemoMode}>
          {isEnabled ? 'On' : 'Off'}
        </Button>
      </div>

      {isEnabled ? (
        <div className='mt-3 space-y-2'>
          <Button type='button' size='sm' className='w-full' disabled={isSeeding || isClearing} onClick={onGenerateDemoContent}>
            {isSeeding ? 'Refreshing...' : 'Refresh activity'}
          </Button>
          <Button
            type='button'
            size='sm'
            variant='danger'
            className='w-full'
            disabled={isClearing || isSeeding}
            onClick={onClearDemoContent}
          >
            {isClearing ? 'Clearing...' : 'Clear activity'}
          </Button>
          {!canCallDemoApi ? <p className='text-xs text-amber-200'>This action is unavailable right now.</p> : null}
          {isSeeding ? (
            <div aria-label='Content loading' className='space-y-1.5'>
              <div className='h-2 w-full animate-pulse rounded bg-[color:var(--bg-layer-3)]' />
              <div className='h-2 w-4/5 animate-pulse rounded bg-[color:var(--bg-layer-3)]/85' />
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  )
}
