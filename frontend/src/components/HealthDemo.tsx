import { useEffect, useState } from 'react'

type HealthResponse = {
  status: string
}

export function HealthDemo() {
  const [text, setText] = useState('Loading health...')

  useEffect(() => {
    let mounted = true
    fetch('/health')
      .then((response) => response.json() as Promise<HealthResponse>)
      .then((data) => {
        if (mounted) {
          setText(`Health: ${data.status}`)
        }
      })
      .catch(() => {
        if (mounted) {
          setText('Health check failed')
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  return <p>{text}</p>
}
