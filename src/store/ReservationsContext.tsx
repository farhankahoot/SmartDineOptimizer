import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  Reservation,
  ReservationStatus,
  SeatingPreference,
} from '@/data/reservations'
import { api } from '@/lib/api'
import { useAuth } from '@/auth/AuthContext'

export interface NewReservationInput {
  customerName: string
  phone: string
  email: string
  date: string
  timeSlot: string
  guests: number
  occasion: string
  seating: SeatingPreference
  table: string
  specialRequest: string
  source: string
}

interface ReservationsValue {
  reservations: Reservation[]
  loading: boolean
  /** Public booking. Resolves to the stored record, including its reference. */
  create: (input: NewReservationInput) => Promise<Reservation>
  setStatus: (id: string, status: ReservationStatus, note?: string) => Promise<void>
  update: (id: string, patch: Partial<Reservation>, note?: string) => Promise<void>
  findById: (id: string) => Reservation | undefined
  /** Module 1 FE-6 — the public tracker resolves a reference to its booking. */
  lookup: (reference: string, contact: string) => Promise<Reservation | undefined>
  /** Module 3 FE-5 — flags a table already taken for the same date and slot. */
  findConflict: (
    table: string,
    date: string,
    timeSlot: string,
    excludeId?: string,
  ) => Reservation | undefined
  refresh: () => Promise<void>
}

const ReservationsContext = createContext<ReservationsValue | null>(null)

/** Blocking statuses — a rejected or cancelled booking frees the table again. */
const HOLDS_TABLE: ReservationStatus[] = ['Pending', 'Confirmed', 'Updated']

interface ApiReservation extends Omit<Reservation, 'history'> {
  history: { status: string; note: string; by: string; at: string }[]
}

/** The API returns ISO timestamps; the screens render the display strings. */
function adapt(r: ApiReservation): Reservation {
  return {
    ...r,
    history: r.history.map((h) => ({
      status: h.status as ReservationStatus | 'Submitted',
      at: formatStamp(h.at),
      by: h.by,
      note: h.note || undefined,
    })),
  }
}

function formatStamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

export function ReservationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const refresh = useCallback(async () => {
    // The list is console-only; a guest on the booking form never loads it.
    if (!user) {
      setItems([])
      return
    }
    setLoading(true)
    const data = await api.probe<{ reservations: ApiReservation[] }>('/reservations', {
      perPage: 100,
    })
    setItems(data ? data.reservations.map(adapt) : [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(async (input: NewReservationInput) => {
    const { reservation } = await api.post<{ reservation: ApiReservation }>(
      '/public/reservations',
      {
        customerName: input.customerName,
        phone: input.phone,
        email: input.email,
        date: input.date,
        timeSlot: input.timeSlot,
        guests: input.guests,
        occasion: input.occasion,
        seating: input.seating,
        table: input.table || undefined,
        specialRequest: input.specialRequest,
      },
    )
    const record = adapt(reservation)
    setItems((prev) => [record, ...prev])
    return record
  }, [])

  const setStatus = useCallback(
    async (id: string, status: ReservationStatus, note?: string) => {
      const { reservation } = await api.post<{ reservation: ApiReservation }>(
        `/reservations/${id}/status`,
        { status, note },
      )
      const record = adapt(reservation)
      setItems((prev) => prev.map((r) => (r.id === id ? record : r)))
    },
    [],
  )

  const update = useCallback(async (id: string, patch: Partial<Reservation>, note?: string) => {
    const { reservation } = await api.patch<{ reservation: ApiReservation }>(
      `/reservations/${id}`,
      {
        ...(patch.customerName ? { customerName: patch.customerName } : {}),
        ...(patch.phone ? { phone: patch.phone } : {}),
        ...(patch.email ? { email: patch.email } : {}),
        ...(patch.date ? { date: patch.date } : {}),
        ...(patch.timeSlot ? { timeSlot: patch.timeSlot } : {}),
        ...(patch.guests ? { guests: patch.guests } : {}),
        ...(patch.occasion ? { occasion: patch.occasion } : {}),
        ...(patch.seating ? { seating: patch.seating } : {}),
        ...(patch.table ? { table: patch.table } : {}),
        ...(patch.specialRequest !== undefined ? { specialRequest: patch.specialRequest } : {}),
      },
    )
    void note
    const record = adapt(reservation)
    setItems((prev) => prev.map((r) => (r.id === id ? record : r)))
  }, [])

  const findById = useCallback(
    (id: string) => items.find((r) => r.id === id || r.reference === id),
    [items],
  )

  /**
   * The tracker is public, so the lookup goes straight to the API rather than
   * filtering a list the guest never loaded. The server masks contact details.
   */
  const lookup = useCallback(async (reference: string, contact: string) => {
    void contact
    try {
      const { reservation } = await api.get<{ reservation: ApiReservation }>(
        `/public/reservations/${encodeURIComponent(reference.trim())}`,
      )
      return adapt(reservation)
    } catch {
      return undefined
    }
  }, [])

  const findConflict = useCallback(
    (table: string, date: string, timeSlot: string, excludeId?: string) =>
      items.find(
        (r) =>
          r.id !== excludeId &&
          r.table === table &&
          r.date === date &&
          r.timeSlot === timeSlot &&
          HOLDS_TABLE.includes(r.status),
      ),
    [items],
  )

  const value = useMemo(
    () => ({
      reservations: items,
      loading,
      create,
      setStatus,
      update,
      findById,
      lookup,
      findConflict,
      refresh,
    }),
    [items, loading, create, setStatus, update, findById, lookup, findConflict, refresh],
  )

  return <ReservationsContext.Provider value={value}>{children}</ReservationsContext.Provider>
}

export function useReservations() {
  const ctx = useContext(ReservationsContext)
  if (!ctx) throw new Error('useReservations must be used inside <ReservationsProvider>')
  return ctx
}
