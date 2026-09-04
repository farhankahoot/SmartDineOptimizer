import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { systemUsers, type Role, type SystemUser, type UserStatus } from '@/data/users'

/**
 * Live user directory. Auth reads it so that blocking an account takes effect
 * on the next sign-in attempt (Module 8 FE-2 / FE-4).
 */
interface UsersValue {
  users: SystemUser[]
  invite: (input: { name: string; email: string; role: Role }) => void
  setRole: (id: string, role: Role) => void
  setStatus: (id: string, status: UserStatus) => void
  remove: (id: string) => void
  find: (email: string) => SystemUser | undefined
}

const UsersContext = createContext<UsersValue | null>(null)

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<SystemUser[]>(systemUsers)

  const invite = useCallback((input: { name: string; email: string; role: Role }) => {
    setUsers((prev) => [
      ...prev,
      {
        id: `U-${String(prev.length + 1).padStart(2, '0')}`,
        name: input.name,
        email: input.email,
        phone: '—',
        role: input.role,
        status: 'Invited',
        lastActive: '—',
        password: 'staff123',
      },
    ])
  }, [])

  const setRole = useCallback((id: string, role: Role) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
  }, [])

  const setStatus = useCallback((id: string, status: UserStatus) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
  }, [])

  const remove = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }, [])

  const find = useCallback(
    (email: string) => users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()),
    [users],
  )

  const value = useMemo(
    () => ({ users, invite, setRole, setStatus, remove, find }),
    [users, invite, setRole, setStatus, remove, find],
  )

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
}

export function useUsers() {
  const ctx = useContext(UsersContext)
  if (!ctx) throw new Error('useUsers must be used inside <UsersProvider>')
  return ctx
}
