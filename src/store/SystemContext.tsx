import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * System-wide switches only an administrator can change. Persisted so that a
 * maintenance window or a lockdown survives a page reload.
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

const STORAGE_KEY = 'smartdine.system'

function read(): SystemSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<SystemSettings>) } : defaults
  } catch {
    return defaults
  }
}

interface SystemValue {
  system: SystemSettings
  update: (patch: Partial<SystemSettings>) => void
  reset: () => void
}

const SystemContext = createContext<SystemValue | null>(null)

export function SystemProvider({ children }: { children: ReactNode }) {
  const [system, setSystem] = useState<SystemSettings>(read)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(system))
  }, [system])

  const update = useCallback((patch: Partial<SystemSettings>) => {
    setSystem((prev) => ({ ...prev, ...patch }))
  }, [])

  const reset = useCallback(() => setSystem(defaults), [])

  const value = useMemo(() => ({ system, update, reset }), [system, update, reset])
  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>
}

export function useSystem() {
  const ctx = useContext(SystemContext)
  if (!ctx) throw new Error('useSystem must be used inside <SystemProvider>')
  return ctx
}
