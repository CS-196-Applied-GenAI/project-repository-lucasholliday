import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

type ToastKind = 'success' | 'error' | 'info'

type Toast = {
  id: number
  message: string
  kind: ToastKind
}

type ToastContextValue = {
  pushToast: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue>({
  pushToast: () => undefined,
})

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const pushToast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((prev) => [...prev, { id, message, kind }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 2400)
  }, [])

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live='polite' className='pointer-events-none fixed right-4 top-4 z-50 space-y-2'>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg border px-3 py-2 text-sm shadow-lg ${
              toast.kind === 'success'
                ? 'border-[var(--accent-500)] bg-[color:var(--accent-glow)] text-[var(--accent-200)]'
                : toast.kind === 'error'
                  ? 'border-red-500/60 bg-red-900/70 text-red-100'
                  : 'border-[var(--border-strong)] bg-[color:var(--bg-layer-2)] text-[var(--text-primary)]'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
