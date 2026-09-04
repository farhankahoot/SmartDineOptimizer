import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  reservations as seed,
  type Reservation,
  type ReservationStatus,
  type SeatingPreference,
} from '@/data/reservations'

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
  create: (input: NewReservationInput) => Reservation
  setStatus: (id: string, status: ReservationStatus, note?: string) => void
  update: (id: string, patch: Partial<Reservation>, note?: string) => void
  findById: (id: string) => Reservation | undefined
  /** Module 1 FE-6 — the public tracker matches a reference to its contact detail. */
  lookup: (reference: string, contact: string) => Reservation | undefined
  /** Module 3 FE-5 — flags a table already taken for the same date and slot. */
  findConflict: (
    table: string,
    date: string,
    timeSlot: string,
    excludeId?: string,
  ) => Reservation | undefined
}

const ReservationsContext = createContext<ReservationsValue | null>(null)

const now = () =>
  new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

/** Blocking statuses — a rejected or cancelled booking frees the table again. */
const HOLDS_TABLE: ReservationStatus[] = ['Pending', 'Confirmed', 'Updated']

export function ReservationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Reservation[]>(seed)

  const create = useCallback((input: NewReservationInput) => {
    const suffix = 2000 + Math.floor(Math.random() * 8000)
    const record: Reservation = {
      ...input,
      id: `R-${suffix}`,
      reference: `RES-2025-${suffix}`,
      status: 'Pending',
      history: [
        {
          status: 'Submitted',
          at: now(),
          by: 'Customer',
          note: 'Reservation request received and awaiting admin approval.',
        },
      ],
    }
    setItems((prev) => [record, ...prev])
    return record
  }, [])

  const setStatus = useCallback((id: string, status: ReservationStatus, note?: string) => {
    setItems((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status, history: [...r.history, { status, at: now(), by: 'Admin User', note }] }
          : r,
      ),
    )
  }, [])

  const update = useCallback((id: string, patch: Partial<Reservation>, note?: string) => {
    setItems((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              ...patch,
              status: 'Updated',
              history: [
                ...r.history,
                { status: 'Updated' as const, at: now(), by: 'Admin User', note },
              ],
            }
          : r,
      ),
    )
  }, [])

  const findById = useCallback((id: string) => items.find((r) => r.id === id), [items])

  const lookup = useCallback(
    (reference: string, contact: string) => {
      const ref = reference.trim().toLowerCase()
      const key = contact.trim().toLowerCase().replace(/\s+/g, '')
      return items.find(
        (r) =>
          r.reference.toLowerCase() === ref &&
          (r.email.toLowerCase() === key || r.phone.toLowerCase().replace(/\s+/g, '') === key),
      )
    },
    [items],
  )

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
    () => ({ reservations: items, create, setStatus, update, findById, lookup, findConflict }),
    [items, create, setStatus, update, findById, lookup, findConflict],
  )

  return <ReservationsContext.Provider value={value}>{children}</ReservationsContext.Provider>
}

export function useReservations() {
  const ctx = useContext(ReservationsContext)
  if (!ctx) throw new Error('useReservations must be used inside <ReservationsProvider>')
  return ctx
}
