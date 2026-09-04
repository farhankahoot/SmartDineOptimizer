import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Restaurant, ShowcaseStatus } from '@/data/restaurants'
import {
  defaultLandingContent,
  type AdminNotification,
  type AdminSession,
  type AuditCategory,
  type AuditEntry,
  type FeatureFlag,
  type LandingContent,
} from '@/data/platform'
import { api } from '@/lib/api'
import { useAuth } from '@/auth/AuthContext'

export type NewRestaurant = Omit<Restaurant, 'id' | 'order' | 'addedOn'>

interface PlatformValue {
  loading: boolean

  /* ------------------------------------------------------- restaurants */
  restaurants: Restaurant[]
  /** Active + ordered, for the public carousel. */
  publicRestaurants: Restaurant[]
  addRestaurant: (input: NewRestaurant) => Promise<Restaurant>
  updateRestaurant: (id: string, patch: Partial<Restaurant>) => Promise<void>
  removeRestaurant: (id: string) => Promise<void>
  setRestaurantStatus: (id: string, status: ShowcaseStatus) => Promise<void>
  toggleFeatured: (id: string) => Promise<void>
  moveRestaurant: (id: string, direction: -1 | 1) => Promise<void>

  /* ----------------------------------------------------- feature flags */
  flags: FeatureFlag[]
  setFlag: (id: string, enabled: boolean) => Promise<void>
  isFeatureOn: (name: string) => boolean

  /* --------------------------------------------------- landing content */
  landing: LandingContent
  setLanding: (patch: Partial<LandingContent>) => Promise<void>
  resetLanding: () => Promise<void>

  /* ------------------------------------------------------- audit trail */
  audit: AuditEntry[]
  /**
   * The server writes an audit entry for every action it performs, so this
   * only refreshes the view. It exists so call sites keep working.
   */
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
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  dismiss: (id: string) => Promise<void>

  /* --------------------------------------------------------- sessions */
  sessions: AdminSession[]
  revokeSession: (id: string) => Promise<void>
  revokeAllOthers: () => Promise<void>

  refresh: () => Promise<void>
}

const PlatformContext = createContext<PlatformValue | null>(null)

/* --------------------------------------------------------------- adapters */

interface ApiRestaurant {
  id: string
  name: string
  city: string
  province: string
  cuisine: string
  description: string
  image?: string
  cover: [string, string]
  website?: string
  featured: boolean
  status: ShowcaseStatus
  order: number
  addedOn: string
}

const adaptRestaurant = (r: ApiRestaurant): Restaurant =>
  ({ ...r, province: r.province, addedOn: formatDate(r.addedOn) }) as Restaurant

interface ApiFlag {
  key: string
  name: string
  description: string
  area: FeatureFlag['area']
  enabled: boolean
  endpoint: string
}

const adaptFlag = (f: ApiFlag): FeatureFlag => ({
  id: f.key,
  name: f.name,
  description: f.description,
  area: f.area,
  enabled: f.enabled,
  endpoint: f.endpoint,
})

interface ApiAudit {
  id: string
  at: string
  actor: string
  action: string
  target: string
  category: AuditCategory
  result: 'Success' | 'Failed'
}

const adaptAudit = (a: ApiAudit): AuditEntry => ({ ...a, at: formatStamp(a.at) })

interface ApiNotification {
  id: string
  tone: AdminNotification['tone']
  title: string
  detail: string
  link: string | null
  read: boolean
  createdAt: string
}

const adaptNotification = (n: ApiNotification): AdminNotification => ({
  id: n.id,
  tone: n.tone,
  title: n.title,
  detail: n.detail,
  at: relative(n.createdAt),
  read: n.read,
  to: n.link ?? undefined,
})

interface ApiSession {
  id: string
  user: string
  email: string
  role: string
  device: string
  location: string
  startedAt: string
  current: boolean
}

const adaptSession = (s: ApiSession): AdminSession => ({ ...s, startedAt: relative(s.startedAt) })

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatStamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${formatDate(iso)} · ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
}

function relative(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const mins = Math.round((Date.now() - d.getTime()) / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return formatDate(iso)
}

/* -------------------------------------------------------------- provider */

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [landing, setLandingState] = useState<LandingContent>(defaultLandingContent)
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [sessions, setSessions] = useState<AdminSession[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  /** Public data everyone can read: the carousel, the flags, the hero copy. */
  const loadPublic = useCallback(async () => {
    try {
      const config = await api.get<{
        showcase: ApiRestaurant[]
        features: Record<string, boolean>
        landing: LandingContent
      }>('/public/config')
      setRestaurants(config.showcase.map(adaptRestaurant))
      setLandingState((prev) => ({ ...prev, ...config.landing }))
    } catch {
      // Leave the defaults so the landing page still renders.
    }
  }, [])

  /** Control-centre data, which needs a session and the platform role. */
  const loadPrivate = useCallback(async () => {
    if (!user) {
      setAudit([])
      setNotifications([])
      setSessions([])
      return
    }

    // Each feed is probed independently: a manager is allowed to be refused
    // the audit trail without that emptying the rest of the console.
    const [rs, fl, ct, au, nt, se] = await Promise.all([
      api.probe<{ restaurants: ApiRestaurant[] }>('/platform/restaurants', { perPage: 100 }),
      api.probe<{ features: ApiFlag[] }>('/platform/features'),
      api.probe<{ content: LandingContent }>('/platform/content'),
      api.probe<{ entries: ApiAudit[] }>('/platform/audit', { perPage: 50 }),
      api.probe<{ notifications: ApiNotification[] }>('/platform/notifications'),
      api.probe<{ sessions: ApiSession[] }>('/platform/sessions'),
    ])

    if (rs) setRestaurants(rs.restaurants.map(adaptRestaurant))
    if (fl) setFlags(fl.features.map(adaptFlag))
    if (ct) setLandingState(ct.content)
    if (au) setAudit(au.entries.map(adaptAudit))
    if (nt) setNotifications(nt.notifications.map(adaptNotification))
    if (se) setSessions(se.sessions.map(adaptSession))
  }, [user])

  const refresh = useCallback(async () => {
    setLoading(true)
    await loadPublic()
    await loadPrivate()
    setLoading(false)
  }, [loadPublic, loadPrivate])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const refreshAudit = useCallback(async () => {
    // A role without `view:audit` simply keeps an empty trail.
    const result = await api.probe<{ entries: ApiAudit[] }>('/platform/audit', { perPage: 50 })
    if (result) setAudit(result.entries.map(adaptAudit))
  }, [])

  /* ------------------------------------------------------ restaurants */

  const addRestaurant = useCallback(
    async (input: NewRestaurant) => {
      const { restaurant } = await api.post<{ restaurant: ApiRestaurant }>(
        '/platform/restaurants',
        {
          name: input.name,
          city: input.city,
          province: input.province,
          cuisine: input.cuisine,
          description: input.description,
          website: input.website ?? '',
          featured: input.featured,
          status: input.status,
          coverFrom: input.cover?.[0],
          coverTo: input.cover?.[1],
          image: input.image,
        },
      )
      const record = adaptRestaurant(restaurant)
      setRestaurants((prev) => [...prev, record])
      void refreshAudit()
      return record
    },
    [refreshAudit],
  )

  const updateRestaurant = useCallback(
    async (id: string, patch: Partial<Restaurant>) => {
      const { restaurant } = await api.patch<{ restaurant: ApiRestaurant }>(
        `/platform/restaurants/${id}`,
        {
          ...(patch.name ? { name: patch.name } : {}),
          ...(patch.city ? { city: patch.city } : {}),
          ...(patch.province ? { province: patch.province } : {}),
          ...(patch.cuisine ? { cuisine: patch.cuisine } : {}),
          ...(patch.description ? { description: patch.description } : {}),
          ...(patch.website !== undefined ? { website: patch.website ?? '' } : {}),
          ...(patch.featured !== undefined ? { featured: patch.featured } : {}),
          ...(patch.status ? { status: patch.status } : {}),
          ...(patch.cover ? { coverFrom: patch.cover[0], coverTo: patch.cover[1] } : {}),
          ...(patch.image !== undefined ? { image: patch.image } : {}),
        },
      )
      setRestaurants((prev) => prev.map((r) => (r.id === id ? adaptRestaurant(restaurant) : r)))
      void refreshAudit()
    },
    [refreshAudit],
  )

  const removeRestaurant = useCallback(
    async (id: string) => {
      await api.del(`/platform/restaurants/${id}`)
      setRestaurants((prev) => prev.filter((r) => r.id !== id))
      void refreshAudit()
    },
    [refreshAudit],
  )

  const setRestaurantStatus = useCallback(
    async (id: string, status: ShowcaseStatus) => {
      await updateRestaurant(id, { status })
    },
    [updateRestaurant],
  )

  const toggleFeatured = useCallback(
    async (id: string) => {
      const target = restaurants.find((r) => r.id === id)
      await updateRestaurant(id, { featured: !target?.featured })
    },
    [restaurants, updateRestaurant],
  )

  /** Swaps a record with its neighbour, then persists the whole order. */
  const moveRestaurant = useCallback(
    async (id: string, direction: -1 | 1) => {
      const sorted = [...restaurants].sort((a, b) => a.order - b.order)
      const index = sorted.findIndex((r) => r.id === id)
      const next = index + direction
      if (index < 0 || next < 0 || next >= sorted.length) return

      const swapped = [...sorted]
      ;[swapped[index], swapped[next]] = [swapped[next], swapped[index]]
      const reordered = swapped.map((r, i) => ({ ...r, order: i + 1 }))
      setRestaurants(reordered)

      await api.put('/platform/restaurants/order', { order: reordered.map((r) => r.id) })
    },
    [restaurants],
  )

  const publicRestaurants = useMemo(
    () => restaurants.filter((r) => r.status === 'Active').sort((a, b) => a.order - b.order),
    [restaurants],
  )

  /* ---------------------------------------------------- feature flags */

  const setFlag = useCallback(
    async (id: string, enabled: boolean) => {
      const { feature } = await api.patch<{ feature: ApiFlag }>(`/platform/features/${id}`, {
        enabled,
      })
      setFlags((prev) => prev.map((f) => (f.id === id ? adaptFlag(feature) : f)))
      void refreshAudit()
    },
    [refreshAudit],
  )

  const isFeatureOn = useCallback(
    (name: string) => flags.find((f) => f.name === name)?.enabled ?? true,
    [flags],
  )

  /* -------------------------------------------------- landing content */

  const setLanding = useCallback(
    async (patch: Partial<LandingContent>) => {
      const { content } = await api.put<{ content: LandingContent }>('/platform/content', patch)
      setLandingState(content)
      void refreshAudit()
    },
    [refreshAudit],
  )

  const resetLanding = useCallback(async () => {
    const { content } = await api.put<{ content: LandingContent }>(
      '/platform/content',
      defaultLandingContent,
    )
    setLandingState(content)
    void refreshAudit()
  }, [refreshAudit])

  /* ------------------------------------------------------ notifications */

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    await api.post(`/platform/notifications/${id}/read`).catch(() => undefined)
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await api.post('/platform/notifications/read-all').catch(() => undefined)
  }, [])

  /** Dismiss is a local hide — the record stays for the audit history. */
  const dismiss = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await api.post(`/platform/notifications/${id}/read`).catch(() => undefined)
  }, [])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  /* ---------------------------------------------------------- sessions */

  const revokeSession = useCallback(
    async (id: string) => {
      await api.del(`/platform/sessions/${id}`)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      void refreshAudit()
    },
    [refreshAudit],
  )

  const revokeAllOthers = useCallback(async () => {
    const others = sessions.filter((s) => !s.current)
    await Promise.allSettled(others.map((s) => api.del(`/platform/sessions/${s.id}`)))
    setSessions((prev) => prev.filter((s) => s.current))
    void refreshAudit()
  }, [sessions, refreshAudit])

  /** Kept for call sites; the server is what actually records the entry. */
  const log = useCallback<PlatformValue['log']>(() => {
    void refreshAudit()
  }, [refreshAudit])

  const value = useMemo(
    () => ({
      loading,
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
      refresh,
    }),
    [
      loading,
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
      refresh,
    ],
  )

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
}

export function usePlatform() {
  const ctx = useContext(PlatformContext)
  if (!ctx) throw new Error('usePlatform must be used inside <PlatformProvider>')
  return ctx
}
