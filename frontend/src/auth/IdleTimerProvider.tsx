import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { apiFetch } from '../api/client'
import { useAuth } from './useAuth'

export const IDLE_TIMEOUT_MS = 15 * 60 * 1000
export const ACTIVITY_STORAGE_THROTTLE_MS = 5000
const LAST_ACTIVITY_KEY = 'chirper_last_activity'

type IdleTimerProviderProps = {
  children: any
  idleTimeoutMs?: number
  storageThrottleMs?: number
}

export function IdleTimerProvider({
  children,
  idleTimeoutMs = IDLE_TIMEOUT_MS,
  storageThrottleMs = ACTIVITY_STORAGE_THROTTLE_MS,
}: IdleTimerProviderProps) {
  const auth = useAuth()
  const navigate = useNavigate()
  const timeoutRef = useRef<number | null>(null)
  const lastStorageWriteAtRef = useRef(0)
  const loggingOutRef = useRef(false)

  useEffect(() => {
    if (!auth.isAuthenticated) return

    const events: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart']

    const saveLastActivity = () => {
      const now = Date.now()
      if (now - lastStorageWriteAtRef.current < storageThrottleMs) return
      lastStorageWriteAtRef.current = now
      window.localStorage.setItem(LAST_ACTIVITY_KEY, String(now))
    }

    const scheduleIdleLogout = () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = window.setTimeout(() => {
        if (loggingOutRef.current) return
        loggingOutRef.current = true
        apiFetch('/auth/logout', { method: 'POST' })
          .catch(() => undefined)
          .finally(() => {
            auth.logout()
            navigate('/login')
          })
      }, idleTimeoutMs)
    }

    const onActivity = () => {
      saveLastActivity()
      scheduleIdleLogout()
    }

    onActivity()
    for (const eventName of events) {
      window.addEventListener(eventName, onActivity, { passive: true })
    }

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
      for (const eventName of events) {
        window.removeEventListener(eventName, onActivity)
      }
    }
  }, [auth, navigate, idleTimeoutMs, storageThrottleMs])

  return <>{children}</>
}
