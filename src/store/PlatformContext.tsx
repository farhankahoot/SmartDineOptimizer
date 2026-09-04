import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  restaurants as restaurantSeed,
  type Restaurant,
  type ShowcaseStatus,
} from '@/data/restaurants'
import {
  auditSeed,
  defaultLandingContent,
  featureFlags as flagSeed,
  notificationSeed,
  sessionSeed,
  type AdminNotification,
  type AdminSession,
  type AuditCategory,
  type AuditEntry,
  type FeatureFlag,
  type LandingContent,
} from '@/data/platform'

export type NewRestaurant = Omit<Restaurant, 'id' | 'order' | 'addedOn'>

interface PlatformValue {
  /* ------------------------------------------------------- restaurants */
  restaurants: Restaurant[]
  /** Active + ordered, for the public carousel. */
  publicRestaurants: Restaurant[]
  addRestaurant: (input: NewRestaurant) => Restaurant
  updateRestaurant: (id: string, patch: Partial<Restaurant>) => void
  removeRestaurant: (id: string) => void
  setRestaurantStatus: (id: string, status: ShowcaseStatus) => void
  toggleFeatured: (id: string) => void
  moveRestaurant: (id: string, direction: -1 | 1) => void

  /* ----------------------------------------------------- feature flags */
  flags: FeatureFlag[]
  setFlag: (id: string, enabled: boolean) => void
  isFeatureOn: (name: string) => boolean

  /* --------------------------------------------------- landing content */
  landing: LandingContent
  setLanding: (patch: Partial<LandingContent>) => void
  resetLanding: () => void

  /* ------------------------------------------------------- audit trail */
  audit: AuditEntry[]
  log: (entry: {
    action: string
    target: string
    category: AuditCategory
    result?: 'Success' | 'Failed'
    actor?: string
  }) => void

  /* ----------------------------------------------------- notifications */
  notifications: AdminNotification[]
  unreadCount: number
  markRead: (id: string) => void
  markAllRead: () => void
  dismiss: (id: string) => void

  /* --------------------------------------------------------- sessions */
  sessions: AdminSession[]
  revokeSession: (id: string) => void
  revokeAllOthers: () => void
}

const PlatformContext = createContext<PlatformValue | null>(null)

const stamp = () =>
  new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(restaurantSeed)
  const [flags, setFlags] = useState<FeatureFlag[]>(flagSeed)
  const [landing, setLandingState] = useState<LandingContent>(defaultLandingContent)
  const [audit, setAudit] = useState<AuditEntry[]>(auditSeed)
  const [notifications, setNotifications] = useState<AdminNotification[]>(notificationSeed)
  const [sessions, setSessions] = useState<AdminSession[]>(sessionSeed)

  /* ------------------------------------------------------ audit first */

  const log = useCallback<PlatformValue['log']>(
    ({ action, target, category, result = 'Success', actor = 'Super Admin' }) => {
      setAudit((prev) => [
        {
          id: `AL-${1043 + prev.length - auditSeed.length}`,
          at: stamp(),
          actor,
          action,
          target,
          category,
          result,
        },
        ...prev,
      ])
    },
    [],
  )

  /* ------------------------------------------------------ restaurants */

  const addRestaurant = useCallback(
    (input: NewRestaurant) => {
      const record: Restaurant = {
        ...input,
        id: `RS-${String(Date.now()).slice(-5)}`,
        order: restaurants.length + 1,
        addedOn: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      }
      setRestaurants((prev) => [...prev, record])
      log({ action: 'Added showcase restaurant', target: record.name, category: 'Restaurant' })
      return record
    },
    [restaurants.length, log],
  )

  const updateRestaurant = useCallback(
    (id: string, patch: Partial<Restaurant>) => {
      setRestaurants((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
      const name = restaurants.find((r) => r.id === id)?.name ?? id
      log({ action: 'Updated showcase restaurant', target: name, category: 'Restaurant' })
    },
    [restaurants, log],
  )

  const removeRestaurant = useCallback(
    (id: string) => {
      const name = restaurants.find((r) => r.id === id)?.name ?? id
      setRestaurants((prev) => prev.filter((r) => r.id !== id))
      log({ action: 'Deleted showcase restaurant', target: name, category: 'Restaurant' })
    },
    [restaurants, log],
  )

  const setRestaurantStatus = useCallback(
    (id: string, status: ShowcaseStatus) => {
      setRestaurants((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
      const name = restaurants.find((r) => r.id === id)?.name ?? id
      log({ action: `Set restaurant status to ${status}`, target: name, category: 'Restaurant' })
    },
    [restaurants, log],
  )

  const toggleFeatured = useCallback(
    (id: string) => {
      const target = restaurants.find((r) => r.id === id)
      setRestaurants((prev) => prev.map((r) => (r.id === id ? { ...r, featured: !r.featured } : r)))
      log({
        action: target?.featured ? 'Removed from featured' : 'Marked as featured',
        target: target?.name ?? id,
        category: 'Restaurant',
      })
    },
    [restaurants, log],
  )

  /** Swaps a record with its neighbour in the ordered list. */
  const moveRestaurant = useCallback((id: string, direction: -1 | 1) => {
    setRestaurants((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order)
      const index = sorted.findIndex((r) => r.id === id)
      const next = index + direction
      if (index < 0 || next < 0 || next >= sorted.length) return prev

      const swapped = [...sorted]
      ;[swapped[index], swapped[next]] = [swapped[next], swapped[index]]
      return swapped.map((r, i) => ({ ...r, order: i + 1 }))
    })
  }, [])

  const publicRestaurants = useMemo(
    () =>
      restaurants.filter((r) => r.status === 'Active').sort((a, b) => a.order - b.order),
    [restaurants],
  )

  /* ---------------------------------------------------- feature flags */

  const setFlag = useCallback(
    (id: string, enabled: boolean) => {
      const flag = flags.find((f) => f.id === id)
      setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, enabled } : f)))
      log({
        action: enabled ? 'Enabled feature flag' : 'Disabled feature flag',
        target: flag?.name ?? id,
        category: 'Feature',
      })
    },
    [flags, log],
  )

  const isFeatureOn = useCallback(
    (name: string) => flags.find((f) => f.name === name)?.enabled ?? true,
    [flags],
  )

  /* -------------------------------------------------- landing content */

  const setLanding = useCallback((patch: Partial<LandingContent>) => {
    setLandingState((prev) => ({ ...prev, ...patch }))
  }, [])

  const resetLanding = useCallback(() => {
    setLandingState(defaultLandingContent)
    log({ action: 'Reset landing page content', target: 'Landing page', category: 'Content' })
  }, [log])

  /* ------------------------------------------------------ notifications */

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  /* ---------------------------------------------------------- sessions */

  const revokeSession = useCallback(
    (id: string) => {
      const target = sessions.find((s) => s.id === id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      log({ action: 'Revoked session', target: target?.email ?? id, category: 'Security' })
    },
    [sessions, log],
  )

  const revokeAllOthers = useCallback(() => {
    setSessions((prev) => prev.filter((s) => s.current))
    log({ action: 'Revoked all other sessions', target: 'All devices', category: 'Security' })
  }, [log])

  const value = useMemo(
    () => ({
      restaurants,
      publicRestaurants,
      addRestaurant,
      updateRestaurant,
      removeRestaurant,
      setRestaurantStatus,
      toggleFeatured,
      moveRestaurant,
      flags,
      setFlag,
      isFeatureOn,
      landing,
      setLanding,
      resetLanding,
      audit,
      log,
      notifications,
      unreadCount,
      markRead,
      markAllRead,
      dismiss,
      sessions,
      revokeSession,
      revokeAllOthers,
    }),
    [
      restaurants,
      publicRestaurants,
      addRestaurant,
      updateRestaurant,
      removeRestaurant,
      setRestaurantStatus,
      toggleFeatured,
      moveRestaurant,
      flags,
      setFlag,
      isFeatureOn,
      landing,
      setLanding,
      resetLanding,
      audit,
      log,
      notifications,
      unreadCount,
      markRead,
      markAllRead,
      dismiss,
      sessions,
      revokeSession,
      revokeAllOthers,
    ],
  )

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
}

export function usePlatform() {
  const ctx = useContext(PlatformContext)
  if (!ctx) throw new Error('usePlatform must be used inside <PlatformProvider>')
  return ctx
}
