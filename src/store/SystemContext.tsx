import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '@/lib/api'

/**
 * System-wide switches only an administrator can change. These live on the
 * server, so a maintenance window applies to every visitor rather than only to
 * the browser that set it.
 */
export interface SystemSettings {
  /** Takes the guest-facing site offline behind a maintenance notice. */
  maintenanceMode: boolean
  maintenanceMessage: string
  /** Module 8 FE-3 — restricts console sign-in to administrators only. */
  adminOnlyLogin: boolean
  /** Closes the public booking form without taking the whole site down. */
  publicBookingEnabled: boolean
  /** Hides the guest status tracker. */
  trackingEnabled: boolean
  /** Self-signup — off by default; this build provisions accounts by invitation. */
  registrationEnabled: boolean
  /** Lets restaurants submit themselves to the showcase for approval. */
  restaurantSubmissionsEnabled: boolean
  /** Shown alongside the maintenance notice. */
  maintenanceEta: string
  /** Auto sign-out after this many idle minutes. */
  sessionTimeoutMinutes: number
  /** Minimum password length enforced on the reset form. */
  minPasswordLength: number
  requireStrongPassword: boolean
  /** Blocks every write action across the console (read-only mode). */
  readOnlyMode: boolean
}

const defaults: SystemSettings = {
  maintenanceMode: false,
  maintenanceMessage:
    'We are performing scheduled maintenance. Online booking will be back shortly — please call 0333 1234567 to reserve a table.',
  adminOnlyLogin: false,
  publicBookingEnabled: true,
  trackingEnabled: true,
  registrationEnabled: false,
  restaurantSubmissionsEnabled: true,
  maintenanceEta: '',
  sessionTimeoutMinutes: 60,
  minPasswordLength: 8,
  requireStrongPassword: true,
  readOnlyMode: false,
}

interface SystemValue {
  system: SystemSettings
  /** True until the server's switches have been read. */
  loading: boolean
  update: (patch: Partial<SystemSettings>) => Promise<void>
  reset: () => Promise<void>
  refresh: () => Promise<void>
}

const SystemContext = createContext<SystemValue | null>(null)

interface PublicConfig {
  system: Partial<SystemSettings>
}

export function SystemProvider({ children }: { children: ReactNode }) {
  const [system, setSystem] = useState<SystemSettings>(defaults)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    // The public config is readable without a session and carries the guest
    // switches; a super admin reading /platform/system gets the full set.
    try {
      const config = await api.get<PublicConfig>('/public/config')
      setSystem((prev) => ({ ...prev, ...config.system }))
    } catch {
      // An unreachable API leaves the defaults in place rather than blanking
      // the site — the pages still render, they just show seed-free state.
    }

    // Only a super admin can read the full switch set; everyone else keeps the
    // public subset, so this is a probe rather than a hard requirement.
    const full = await api.probe<{ system: SystemSettings }>('/platform/system')
    if (full) setSystem((prev) => ({ ...prev, ...full.system }))
  }, [])

  useEffect(() => {
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  const update = useCallback(async (patch: Partial<SystemSettings>) => {
    const { system: next } = await api.put<{ system: SystemSettings }>('/platform/system', patch)
    setSystem(next)
  }, [])

  const reset = useCallback(async () => {
    const { system: next } = await api.put<{ system: SystemSettings }>('/platform/system', defaults)
    setSystem(next)
  }, [])

  const value = useMemo(
    () => ({ system, loading, update, reset, refresh }),
    [system, loading, update, reset, refresh],
  )
  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>
}

export function useSystem() {
  const ctx = useContext(SystemContext)
  if (!ctx) throw new Error('useSystem must be used inside <SystemProvider>')
  return ctx
}
