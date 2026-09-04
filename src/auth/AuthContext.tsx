import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { can, type Permission, type Role } from '@/data/users'
import { useUsers } from '@/store/UsersContext'
import { useSystem } from '@/store/SystemContext'

export interface Session {
  id: string
  name: string
  email: string
  role: Role
}

interface AuthValue {
  user: Session | null
  signIn: (email: string, password: string) => Promise<Session>
  signOut: () => void
  /** Module 8 FE-3/FE-4 — every gated action funnels through this. */
  allows: (permission: Permission) => boolean
}

const AuthContext = createContext<AuthValue | null>(null)

const STORAGE_KEY = 'smartdine.session'

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

/** Simulates the round-trip a real `/auth/login` call would take. */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session | null>(readStoredSession)
  const { find } = useUsers()
  const { system } = useSystem()

  const signIn = useCallback(
    async (email: string, password: string) => {
      await delay(600)

      const match = find(email)

      if (!match || match.password !== password) {
        throw new Error('Incorrect email or password. Please try again.')
      }
      if (match.status === 'Suspended') {
        throw new Error('This account has been blocked by an administrator.')
      }
      if (match.status === 'Invited') {
        throw new Error(
          'This invitation has not been accepted yet. Check your email to set a password.',
        )
      }
      // System control — administrators can lock everyone else out.
      if (system.adminOnlyLogin && match.role !== 'admin') {
        throw new Error(
          'The console is currently restricted to administrators. Contact your administrator for access.',
        )
      }

      const session: Session = {
        id: match.id,
        name: match.name,
        email: match.email,
        role: match.role,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      setUser(session)
      return session
    },
    [find, system.adminOnlyLogin],
  )

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const allows = useCallback(
    (permission: Permission) => {
      if (!user) return false
      // Read-only mode leaves every view reachable but blocks writes.
      if (system.readOnlyMode && permission.startsWith('manage:') && user.role !== 'admin') {
        return false
      }
      return can(user.role, permission)
    },
    [user, system.readOnlyMode],
  )

  const value = useMemo(() => ({ user, signIn, signOut, allows }), [user, signIn, signOut, allows])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
