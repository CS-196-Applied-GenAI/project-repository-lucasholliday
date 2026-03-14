import { useState } from 'react'

import { apiFetch } from '../api/client'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

type HealthPayload = { status?: string }
type DbHealthPayload = { ok?: boolean; status?: string; db?: string }

export function SystemStatusCard() {
  const [statusText, setStatusText] = useState('Unavailable')
  const [checking, setChecking] = useState(false)

  async function onCheckStatus() {
    setChecking(true)
    try {
      const health = await apiFetch<HealthPayload>('/health')
      const dbHealth = await apiFetch<DbHealthPayload>('/health/db')
      const apiStatus = health.status === 'ok'
      const dbStatus = dbHealth.ok || dbHealth.status === 'ok'
      setStatusText(apiStatus && dbStatus ? 'Online' : 'Unavailable')
    } catch {
      setStatusText('Unavailable')
    } finally {
      setChecking(false)
    }
  }

  return (
    <Card as='aside' className='mt-5 p-3'>
      <p className='text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-300)]'>Status</p>
      <p className='mt-2 text-sm text-[var(--text-secondary)]'>{statusText}</p>
      <Button
        type='button'
        onClick={onCheckStatus}
        disabled={checking}
        className='mt-3'
        size='sm'
      >
        {checking ? 'Opening...' : 'Open'}
      </Button>
    </Card>
  )
}
