export type SlotStatus = 'Open' | 'Full' | 'Almost Full' | 'Closed' | 'Blocked'

export interface TimeSlotRow {
  id: string
  slot: string
  start: string
  end: string
  maxReservations: number
  availableTables: number | null
  status: SlotStatus
}

export const timeSlotRows: TimeSlotRow[] = [
  { id: 'S1', slot: '12:00 PM – 2:00 PM', start: '12:00 PM', end: '2:00 PM', maxReservations: 28, availableTables: 9, status: 'Open' },
  { id: 'S2', slot: '2:00 PM – 4:00 PM', start: '2:00 PM', end: '4:00 PM', maxReservations: 28, availableTables: 0, status: 'Full' },
  { id: 'S3', slot: '6:00 PM – 8:00 PM', start: '6:00 PM', end: '8:00 PM', maxReservations: 28, availableTables: 4, status: 'Open' },
  { id: 'S4', slot: '8:00 PM – 10:00 PM', start: '8:00 PM', end: '10:00 PM', maxReservations: 28, availableTables: 1, status: 'Almost Full' },
  { id: 'S5', slot: '10:00 PM – 11:59 PM', start: '10:00 PM', end: '11:59 PM', maxReservations: 16, availableTables: 8, status: 'Closed' },
  { id: 'S6', slot: 'All Day (Maintenance)', start: '12:00 AM', end: '11:59 PM', maxReservations: 0, availableTables: null, status: 'Blocked' },
]

export interface SlotDraft {
  slot: string
  start: string
  end: string
  maxReservations: number
  status: SlotStatus
  mealPeriod: string
}

export const slotStatuses: SlotStatus[] = ['Open', 'Full', 'Almost Full', 'Closed', 'Blocked']

export const slotTimeOptions = [
  '12:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
  '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM', '11:59 PM',
]

export const slotFilters = {
  days: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  statuses: ['All', 'Open', 'Full', 'Almost Full', 'Closed', 'Blocked'],
  mealPeriods: ['All', 'Lunch', 'Dinner', 'Late Night'],
}
