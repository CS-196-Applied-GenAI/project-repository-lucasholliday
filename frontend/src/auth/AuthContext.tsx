import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import { apiFetch, setApiUnauthorizedHandler } from '../api/client'
import { clearToken, getToken, setToken } from '../storage/token'

type Me = {
  username: string
  bio?: string | null
  profile_picture?: string | null
}

type AuthContextValue = {
  token: string | null
  isAuthenticated: boolean
  me: Me | null
  login: (token: string) => void
  logout: () => void
  setMe: (me: Me | null) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [me, setMeState] = useState<Me | null>(null)

  const setMe = useCallback((nextMe: Me | null) => {
    setMeState(nextMe)
  }, [])

  const login = useCallback((nextToken: string) => {
    setToken(nextToken)
    setTokenState(nextToken)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setTokenState(null)
    setMeState(null)
  }, [])

  useEffect(() => {
    setApiUnauthorizedHandler(logout)

    return () => {
      setApiUnauthorizedHandler(undefined)
    }
  }, [logout])

  useEffect(() => {
    if (!token) {
      return
    }

    let active = true
    apiFetch<Me>('/auth/me')
      .then((data) => {
        if (!active) return
        setMeState(data)
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [token])

  const value = useMemo<AuthContextValue>(
    () => ({ token, isAuthenticated: Boolean(token), me, login, logout, setMe }),
    [token, me, login, logout, setMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
