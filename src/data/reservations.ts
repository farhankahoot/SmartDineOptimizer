/** Module 1 FE-6 / Module 2 FE-2: the five states a booking can move through. */
export type ReservationStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Updated'
  | 'Rejected'
  | 'Cancelled'
  | 'Completed'

/** Module 1 FE-3 / BO-2: seating preference is a first-class booking parameter. */
export type SeatingPreference =
  | 'No preference'
  | 'Window side'
  | 'Indoor'
  | 'Outdoor'
  | 'Private room'
  | 'Quiet corner'

export const seatingPreferences: SeatingPreference[] = [
  'No preference',
  'Window side',
  'Indoor',
  'Outdoor',
  'Private room',
  'Quiet corner',
]

export interface StatusEvent {
  status: ReservationStatus | 'Submitted'
  at: string
  by: string
  note?: string
}

export interface Reservation {
  id: string
  /** Customer-facing code used by the public status tracker. */
  reference: string
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
  status: ReservationStatus
  /** Module 2 FE-5: full status trail kept for reservation history. */
  history: StatusEvent[]
}

const trail = (status: ReservationStatus, submittedAt: string, actedAt?: string): StatusEvent[] => {
  const events: StatusEvent[] = [
    { status: 'Submitted', at: submittedAt, by: 'Customer', note: 'Reservation request received.' },
  ]
  if (status !== 'Pending') {
    events.push({
      status,
      at: actedAt ?? submittedAt,
      by: 'Admin User',
      note:
        status === 'Confirmed'
          ? 'Table assigned and confirmation sent.'
          : status === 'Rejected'
            ? 'No table available for the requested slot.'
            : status === 'Cancelled'
              ? 'Cancelled at the customer’s request.'
              : status === 'Updated'
                ? 'Booking details revised by the restaurant.'
                : 'Guests seated and visit completed.',
    })
  }
  return events
}

/** Rows 1–10 are exactly the mockup; rows 11–20 extend the visible variety. */
const seedReservations: Reservation[] = [
  { id: 'R-1001', reference: 'RES-2025-1001', customerName: 'Rahul Sharma', phone: '+91 98765 43210', email: 'rahul.sharma@gmail.com', date: 'May 22, 2025', timeSlot: '7:30 PM', guests: 4, occasion: 'Birthday', seating: 'Window side', table: 'A12', specialRequest: 'No onions', source: 'Website Booking', status: 'Pending', history: trail('Pending', 'May 20, 2025 · 10:12 AM') },
  { id: 'R-1002', reference: 'RES-2025-1002', customerName: 'Priya Mehta', phone: '+91 91234 56789', email: 'priya.mehta@gmail.com', date: 'May 22, 2025', timeSlot: '8:00 PM', guests: 2, occasion: 'Anniversary', seating: 'Window side', table: 'B07', specialRequest: 'Window seat', source: 'Manual Entry', status: 'Confirmed', history: trail('Confirmed', 'May 20, 2025 · 10:40 AM', 'May 20, 2025 · 11:05 AM') },
  { id: 'R-1003', reference: 'RES-2025-1003', customerName: 'Arjun Iyer', phone: '+91 99876 54321', email: 'arjun.iyer@example.com', date: 'May 22, 2025', timeSlot: '8:30 PM', guests: 4, occasion: 'Family Dinner', seating: 'Indoor', table: 'C03', specialRequest: 'Kids high chair', source: 'Phone Call', status: 'Confirmed', history: trail('Confirmed', 'May 20, 2025 · 11:15 AM', 'May 20, 2025 · 11:30 AM') },
  { id: 'R-1004', reference: 'RES-2025-1004', customerName: 'Neha Kapoor', phone: '+91 98123 45678', email: 'neha.kapoor@gmail.com', date: 'May 22, 2025', timeSlot: '9:00 PM', guests: 2, occasion: 'Date Night', seating: 'Quiet corner', table: 'B12', specialRequest: 'Candle light', source: 'WhatsApp', status: 'Pending', history: trail('Pending', 'May 20, 2025 · 12:02 PM') },
  { id: 'R-1005', reference: 'RES-2025-1005', customerName: 'Vikram Singh', phone: '+91 90012 34567', email: 'vikram.singh@example.com', date: 'May 22, 2025', timeSlot: '7:00 PM', guests: 8, occasion: 'Corporate Dinner', seating: 'Private room', table: 'A01', specialRequest: 'Projector needed', source: 'Manual Entry', status: 'Confirmed', history: trail('Confirmed', 'May 20, 2025 · 1:20 PM', 'May 20, 2025 · 1:35 PM') },
  { id: 'R-1006', reference: 'RES-2025-1006', customerName: 'Sneha Reddy', phone: '+91 96456 78901', email: 'sneha.reddy@gmail.com', date: 'May 22, 2025', timeSlot: '6:30 PM', guests: 3, occasion: 'Birthday', seating: 'Indoor', table: 'C08', specialRequest: 'Gluten free', source: 'Website Booking', status: 'Cancelled', history: trail('Cancelled', 'May 19, 2025 · 4:10 PM', 'May 21, 2025 · 9:02 AM') },
  { id: 'R-1007', reference: 'RES-2025-1007', customerName: 'Karan Malhotra', phone: '+91 97543 21090', email: 'karan.malhotra@example.com', date: 'May 22, 2025', timeSlot: '9:30 PM', guests: 2, occasion: 'Anniversary', seating: 'Quiet corner', table: 'B05', specialRequest: 'Quiet table', source: 'Phone Call', status: 'Completed', history: trail('Completed', 'May 18, 2025 · 6:44 PM', 'May 22, 2025 · 11:15 PM') },
  { id: 'R-1008', reference: 'RES-2025-1008', customerName: 'Ananya Das', phone: '+91 88888 76543', email: 'ananya.das@gmail.com', date: 'May 23, 2025', timeSlot: '12:30 PM', guests: 4, occasion: 'Lunch Meeting', seating: 'Indoor', table: 'A09', specialRequest: 'Quick Service', source: 'WhatsApp', status: 'Confirmed', history: trail('Confirmed', 'May 21, 2025 · 8:30 AM', 'May 21, 2025 · 8:50 AM') },
  { id: 'R-1009', reference: 'RES-2025-1009', customerName: 'Rohit Verma', phone: '+91 95555 12345', email: 'rohit.verma@example.com', date: 'May 23, 2025', timeSlot: '1:00 PM', guests: 10, occasion: 'Corporate Lunch', seating: 'Private room', table: 'D01', specialRequest: 'Billing separate', source: 'Manual Entry', status: 'Pending', history: trail('Pending', 'May 21, 2025 · 9:14 AM') },
  { id: 'R-1010', reference: 'RES-2025-1010', customerName: 'Pooja Nair', phone: '+91 90909 87654', email: 'pooja.nair@gmail.com', date: 'May 23, 2025', timeSlot: '7:30 PM', guests: 5, occasion: 'Family Dinner', seating: 'Indoor', table: 'C05', specialRequest: 'No spicy food', source: 'Website Booking', status: 'Confirmed', history: trail('Confirmed', 'May 21, 2025 · 10:05 AM', 'May 21, 2025 · 10:22 AM') },
  { id: 'R-1011', reference: 'RES-2025-1011', customerName: 'Aditya Menon', phone: '+91 93456 11223', email: 'aditya.menon@gmail.com', date: 'May 23, 2025', timeSlot: '8:00 PM', guests: 6, occasion: 'Birthday', seating: 'Window side', table: 'B02', specialRequest: 'Cake at 9 PM', source: 'Website Booking', status: 'Confirmed', history: trail('Confirmed', 'May 21, 2025 · 11:40 AM', 'May 21, 2025 · 12:01 PM') },
  { id: 'R-1012', reference: 'RES-2025-1012', customerName: 'Ishita Roy', phone: '+91 90111 44556', email: 'ishita.roy@example.com', date: 'May 23, 2025', timeSlot: '8:30 PM', guests: 2, occasion: 'Date Night', seating: 'Quiet corner', table: 'B11', specialRequest: 'Corner table', source: 'WhatsApp', status: 'Pending', history: trail('Pending', 'May 21, 2025 · 2:18 PM') },
  { id: 'R-1013', reference: 'RES-2025-1013', customerName: 'Manav Gupta', phone: '+91 98700 33221', email: 'manav.gupta@gmail.com', date: 'May 24, 2025', timeSlot: '7:00 PM', guests: 4, occasion: 'Family Dinner', seating: 'Indoor', table: 'C02', specialRequest: 'Baby chair', source: 'Phone Call', status: 'Confirmed', history: trail('Confirmed', 'May 22, 2025 · 9:02 AM', 'May 22, 2025 · 9:20 AM') },
  { id: 'R-1014', reference: 'RES-2025-1014', customerName: 'Divya Suresh', phone: '+91 99001 77889', email: 'divya.suresh@example.com', date: 'May 24, 2025', timeSlot: '9:00 PM', guests: 3, occasion: 'Anniversary', seating: 'Window side', table: 'A05', specialRequest: 'Flower setup', source: 'Manual Entry', status: 'Updated', history: [...trail('Confirmed', 'May 22, 2025 · 10:11 AM', 'May 22, 2025 · 10:30 AM'), { status: 'Updated', at: 'May 23, 2025 · 3:45 PM', by: 'Admin User', note: 'Moved from 8:30 PM to 9:00 PM at guest request.' }] },
  { id: 'R-1015', reference: 'RES-2025-1015', customerName: 'Farhan Sheikh', phone: '+91 97865 55443', email: 'farhan.sheikh@gmail.com', date: 'May 24, 2025', timeSlot: '6:30 PM', guests: 8, occasion: 'Corporate Dinner', seating: 'Private room', table: 'D02', specialRequest: 'Vegetarian only', source: 'Website Booking', status: 'Confirmed', history: trail('Confirmed', 'May 22, 2025 · 11:50 AM', 'May 22, 2025 · 12:10 PM') },
  { id: 'R-1016', reference: 'RES-2025-1016', customerName: 'Meera Joshi', phone: '+91 90345 99887', email: 'meera.joshi@example.com', date: 'May 24, 2025', timeSlot: '1:30 PM', guests: 2, occasion: 'Lunch Meeting', seating: 'Window side', table: 'A07', specialRequest: 'Near window', source: 'WhatsApp', status: 'Completed', history: trail('Completed', 'May 20, 2025 · 5:30 PM', 'May 24, 2025 · 3:05 PM') },
  { id: 'R-1017', reference: 'RES-2025-1017', customerName: 'Nikhil Rao', phone: '+91 98222 66554', email: 'nikhil.rao@gmail.com', date: 'May 25, 2025', timeSlot: '8:00 PM', guests: 5, occasion: 'Birthday', seating: 'Indoor', table: 'C07', specialRequest: 'Balloon decor', source: 'Website Booking', status: 'Pending', history: trail('Pending', 'May 23, 2025 · 8:40 AM') },
  { id: 'R-1018', reference: 'RES-2025-1018', customerName: 'Tanya Bhatt', phone: '+91 93999 22110', email: 'tanya.bhatt@example.com', date: 'May 25, 2025', timeSlot: '7:30 PM', guests: 4, occasion: 'Family Dinner', seating: 'Indoor', table: 'B09', specialRequest: 'Less oil', source: 'Phone Call', status: 'Confirmed', history: trail('Confirmed', 'May 23, 2025 · 9:25 AM', 'May 23, 2025 · 9:44 AM') },
  { id: 'R-1019', reference: 'RES-2025-1019', customerName: 'Sameer Khan', phone: '+91 91777 88990', email: 'sameer.khan@gmail.com', date: 'May 25, 2025', timeSlot: '9:30 PM', guests: 2, occasion: 'Date Night', seating: 'Outdoor', table: 'B14', specialRequest: 'Candle light', source: 'Manual Entry', status: 'Rejected', history: trail('Rejected', 'May 23, 2025 · 12:12 PM', 'May 23, 2025 · 1:02 PM') },
  { id: 'R-1020', reference: 'RES-2025-1020', customerName: 'Ritu Agarwal', phone: '+91 96666 12312', email: 'ritu.agarwal@example.com', date: 'May 25, 2025', timeSlot: '8:30 PM', guests: 6, occasion: 'Group Celebration', seating: 'Indoor', table: 'D03', specialRequest: 'Shared platters', source: 'Website Booking', status: 'Confirmed', history: trail('Confirmed', 'May 23, 2025 · 2:40 PM', 'May 23, 2025 · 3:00 PM') },
]

/**
 * The mockup's footer reads "Showing 1 to 10 of 58 reservations" across 6 pages,
 * so the seed rows are cycled out to that total.
 */
const TOTAL_RESERVATIONS = 58

export const reservations: Reservation[] = Array.from({ length: TOTAL_RESERVATIONS }, (_, i) => {
  const seed = seedReservations[i % seedReservations.length]
  if (i < seedReservations.length) return seed
  const id = `R-${1001 + i}`
  return { ...seed, id, reference: `RES-2025-${1001 + i}` }
})

/** Header KPI row of the Admin Reservation Management screen. */
export const reservationStats = [
  { key: 'total', label: 'Total Reservations', value: '1,258', delta: '12.5%', trend: 'up' as const, caption: 'from last 7 days' },
  { key: 'pending', label: 'Pending Reservations', value: '128', delta: '8.2%', trend: 'up' as const, caption: 'from last 7 days' },
  { key: 'confirmed', label: 'Confirmed Reservations', value: '876', delta: '15.7%', trend: 'up' as const, caption: 'from last 7 days' },
  { key: 'cancelled', label: 'Cancelled Reservations', value: '96', delta: '5.1%', trend: 'down' as const, caption: 'from last 7 days' },
  { key: 'guests', label: "Today's Guests", value: '342', delta: '10.3%', trend: 'up' as const, caption: 'from yesterday' },
]

export interface UpcomingBooking {
  time: string
  name: string
  guests: number
  table: string
}

export const upcomingBookings: UpcomingBooking[] = [
  { time: '6:30 PM', name: 'Sneha Reddy', guests: 3, table: 'C08' },
  { time: '7:00 PM', name: 'Vikram Singh', guests: 8, table: 'A01' },
  { time: '7:30 PM', name: 'Rahul Sharma', guests: 4, table: 'A12' },
  { time: '8:00 PM', name: 'Priya Mehta', guests: 2, table: 'B07' },
  { time: '8:30 PM', name: 'Arjun Iyer', guests: 4, table: 'C03' },
  { time: '9:00 PM', name: 'Neha Kapoor', guests: 2, table: 'B12' },
  { time: '9:30 PM', name: 'Karan Malhotra', guests: 2, table: 'B05' },
]

export const occasionTypes = [
  'Birthday',
  'Anniversary',
  'Family Dinner',
  'Date Night',
  'Corporate Dinner',
  'Corporate Lunch',
  'Lunch Meeting',
  'Group Celebration',
  'Other',
]

export const bookingSources = ['Website Booking', 'Manual Entry', 'Phone Call', 'WhatsApp']

export const reservationFilters = {
  statuses: ['All Statuses', 'Pending', 'Confirmed', 'Updated', 'Rejected', 'Cancelled', 'Completed'],
  occasions: ['All Occasions', ...occasionTypes],
  timeSlots: ['All Time Slots', '12:30 PM', '1:00 PM', '1:30 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM'],
  sources: ['All Sources', ...bookingSources],
  partySizes: ['Any party size', '1–2 guests', '3–4 guests', '5–8 guests', '9+ guests'],
}

/** Statuses that belong to the live worklist vs. the history tab (Module 2 FE-5). */
export const activeStatuses: ReservationStatus[] = ['Pending', 'Confirmed', 'Updated']
export const historyStatuses: ReservationStatus[] = ['Completed', 'Cancelled', 'Rejected']

export function matchesPartySize(guests: number, bucket: string): boolean {
  switch (bucket) {
    case '1–2 guests':
      return guests <= 2
    case '3–4 guests':
      return guests >= 3 && guests <= 4
    case '5–8 guests':
      return guests >= 5 && guests <= 8
    case '9+ guests':
      return guests >= 9
    default:
      return true
  }
}
