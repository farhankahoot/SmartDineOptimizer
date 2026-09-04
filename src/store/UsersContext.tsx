import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Role, SystemUser, UserStatus } from '@/data/users'
import { api } from '@/lib/api'
import { useAuth } from '@/auth/AuthContext'

/**
 * Live user directory backed by the API (Module 8 FE-2 / FE-4).
 *
 * Passwords are never carried here. Blocking an account takes effect
 * immediately because the server revokes that user's sessions.
 */
interface UsersValue {
  users: SystemUser[]
  loading: boolean
  invite: (input: { name: string; email: string; role: Role }) => Promise<void>
  setRole: (id: string, role: Role) => Promise<void>
  setStatus: (id: string, status: UserStatus) => Promise<void>
  remove: (id: string) => Promise<void>
  find: (email: string) => SystemUser | undefined
  refresh: () => Promise<void>
}

const UsersContext = createContext<UsersValue | null>(null)

interface ApiUser {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  status: UserStatus
  lastActiveAt: string | null
}

function adapt(u: ApiUser): SystemUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status,
    lastActive: u.lastActiveAt ? formatStamp(u.lastActiveAt) : '—',
    // The API never returns credentials; the field stays for type parity.
    password: '',
  }
}

function formatStamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  if (sameDay) return `Today, ${time}`
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(false)
  const { user: currentUser } = useAuth()

  const refresh = useCallback(async () => {
    if (!currentUser) {
      setUsers([])
      return
    }
    setLoading(true)
    // Roles below `manage:users` cannot read the directory; that is expected.
    const data = await api.probe<{ users: ApiUser[] }>('/users')
    setUsers(data ? data.users.map(adapt) : [])
    setLoading(false)
  }, [currentUser])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const invite = useCallback(
    async (input: { name: string; email: string; role: Role }) => {
      await api.post('/users', input)
      await refresh()
    },
    [refresh],
  )

  const setRole = useCallback(async (id: string, role: Role) => {
    const { user } = await api.patch<{ user: ApiUser }>(`/users/${id}`, { role })
    setUsers((prev) => prev.map((u) => (u.id === id ? adapt(user) : u)))
  }, [])

  const setStatus = useCallback(async (id: string, status: UserStatus) => {
    const { user } = await api.post<{ user: ApiUser }>(`/users/${id}/status`, { status })
    setUsers((prev) => prev.map((u) => (u.id === id ? adapt(user) : u)))
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.del(`/users/${id}`)
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }, [])

  const find = useCallback(
    (email: string) => users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()),
    [users],
  )

  const value = useMemo(
    () => ({ users, loading, invite, setRole, setStatus, remove, find, refresh }),
    [users, loading, invite, setRole, setStatus, remove, find, refresh],
  )

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
}

export function useUsers() {
  const ctx = useContext(UsersContext)
  if (!ctx) throw new Error('useUsers must be used inside <UsersProvider>')
  return ctx
}
