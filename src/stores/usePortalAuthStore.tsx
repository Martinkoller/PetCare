import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'
import api from '@/lib/api'

interface PortalUser {
  id: string
  email: string
  name: string
  role: 'client_portal'
  clientId: string
  organizationId: string
}

interface PortalAuthContextType {
  user: PortalUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: { message: string } }>
  signOut: () => void
}

const PORTAL_TOKEN_KEY = 'portal_token'
const PORTAL_USER_KEY = 'portal_user'

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined)

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(PORTAL_TOKEN_KEY)
    const raw = localStorage.getItem(PORTAL_USER_KEY)
    if (token && raw) {
      try { setUser(JSON.parse(raw)) } catch {}
    }
    setLoading(false)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post('/portal/login', { email, password })
      localStorage.setItem(PORTAL_TOKEN_KEY, data.token)
      localStorage.setItem(PORTAL_USER_KEY, JSON.stringify(data.user))
      // Swap token used by api instance for portal requests
      api.defaults.headers.common['X-Portal-Token'] = data.token
      setUser(data.user)
      return {}
    } catch (e: any) {
      return { error: { message: e?.response?.data?.error ?? 'Erro ao entrar.' } }
    }
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(PORTAL_TOKEN_KEY)
    localStorage.removeItem(PORTAL_USER_KEY)
    setUser(null)
  }, [])

  return (
    <PortalAuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </PortalAuthContext.Provider>
  )
}

export function usePortalAuth() {
  const ctx = useContext(PortalAuthContext)
  if (!ctx) throw new Error('usePortalAuth must be inside PortalAuthProvider')
  return ctx
}

// Helper: returns portal token for API calls
export const getPortalToken = () => localStorage.getItem(PORTAL_TOKEN_KEY)
