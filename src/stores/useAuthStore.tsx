import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
} from 'react'
import { User } from '@/lib/types'
import api from '@/lib/api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isRealUser: boolean  // true when logged in with real credentials (not public-user)
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  logout: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const response = await api.get('/auth/me')
      setUser(response.data)
    } catch {
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password })
      const { token, user: userData } = res.data
      localStorage.setItem('token', token)
      setUser(userData)
      return { error: null }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Credenciais inválidas'
      return { error: { message } }
    }
  }, [])

  const signOut = useCallback(async () => {
    localStorage.removeItem('token')
    setUser(null)
    return { error: null }
  }, [])

  const logout = useCallback(async () => signOut(), [signOut])

  const resetPassword = useCallback(async (_email: string) => {
    return { error: null }
  }, [])

  const updatePassword = useCallback(async (_password: string) => {
    return { error: null }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isRealUser: user !== null && user.id !== 'public-user',
      loading,
      signIn,
      signOut,
      logout,
      resetPassword,
      updatePassword,
    }),
    [user, loading, signIn, signOut, logout, resetPassword, updatePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthStore() {
  const context = useContext(AuthContext)
  if (undefined === context) {
    throw new Error('useAuthStore must be used within an AuthProvider')
  }
  return context
}
