import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { can, type Permission, type Role } from '@/data/users'
import { useSystem } from '@/store/SystemContext'
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from '@/lib/api'

export interface Session {
  id: string
  name: string
  email: string
  role: Role
  /** Granted by the server; the client only uses it to hide controls. */
  permissions: Permission[]
}

interface AuthValue {
  user: Session | null
  /** True until the stored token has been checked against the server. */
  loading: boolean
  signIn: (email: string, password: string) => Promise<Session>
  signOut: () => void
  /** Module 8 FE-3/FE-4 — every gated control funnels through this. */
  allows: (permission: Permission) => boolean
}

const AuthContext = createContext<AuthValue | null>(null)

interface UserPayload {
  user: { id: string; name: string; email: string; role: Role; permissions: Permission[] }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(getToken()))
  const { system } = useSystem()

  // A token rejected by the server clears the session rather than leaving the
  // console in a half-signed-in state.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
  }, [])

  // Restores the session on boot. The server is the authority: a token for a
  // deleted or blocked account will not resolve to a user.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }

    let cancelled = false
    api
      .get<UserPayload>('/auth/me')
      .then(({ user: u }) => {
        if (!cancelled) setUser(u)
      })
      .catch(() => {
        clearToken()
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await api.post<UserPayload & { token: string }>('/auth/login', {
      email,
      password,
    })
    setToken(result.token)
    setUser(result.user)
    return result.user
  }, [])

  const signOut = useCallback(() => {
    // Revoke server-side, but clear locally regardless so the user is out.
    void api.post('/auth/logout').catch(() => undefined)
    clearToken()
    setUser(null)
  }, [])

  const allows = useCallback(
    (permission: Permission) => {
      if (!user) return false
      // Read-only mode leaves every view reachable but hides write controls.
      // The server enforces the same rule, so this is presentation only.
      if (system.readOnlyMode && permission.startsWith('manage:') && user.role !== 'superadmin') {
        return false
      }
      return user.permissions ? user.permissions.includes(permission) : can(user.role, permission)
    },
    [user, system.readOnlyMode],
  )

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, allows }),
    [user, loading, signIn, signOut, allows],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
