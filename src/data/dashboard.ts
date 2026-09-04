/** Module 6 FE-2 — footfall by time slot for today. */
export const footfallToday = [
  { slot: '12 PM', guests: 42 },
  { slot: '1 PM', guests: 58 },
  { slot: '2 PM', guests: 47 },
  { slot: '3 PM', guests: 28 },
  { slot: '6 PM', guests: 66 },
  { slot: '7 PM', guests: 84 },
  { slot: '8 PM', guests: 96 },
  { slot: '9 PM', guests: 71 },
  { slot: '10 PM', guests: 38 },
]

/** Module 6 FE-3 — revenue trend with the forecast tail. */
export const revenueTrend = [
  { day: 'Mon', actual: 182000, forecast: 178000 },
  { day: 'Tue', actual: 164000, forecast: 170000 },
  { day: 'Wed', actual: 205000, forecast: 198000 },
  { day: 'Thu', actual: 221000, forecast: 216000 },
  { day: 'Fri', actual: 268000, forecast: 259000 },
  { day: 'Sat', actual: 312000, forecast: 305000 },
  { day: 'Sun', actual: null, forecast: 288000 },
]

/** Module 6 FE-1 — reservation mix for the selected period. */
export const reservationMix = [
  { name: 'Confirmed', value: 876, color: '#125E2E' },
  { name: 'Pending', value: 128, color: '#C2761C' },
  { name: 'Completed', value: 158, color: '#2563EB' },
  { name: 'Cancelled', value: 96, color: '#C0392B' },
]

/** Module 6 FE-4 — peak-hour insight strip. */
export const peakHours = [
  { slot: '6:00 PM – 8:00 PM', load: 78, tone: 'warn' as const, label: 'Filling up' },
  { slot: '8:00 PM – 10:00 PM', load: 96, tone: 'danger' as const, label: 'Peak' },
  { slot: '12:00 PM – 2:00 PM', load: 54, tone: 'ok' as const, label: 'Steady' },
  { slot: '10:00 PM – 11:59 PM', load: 31, tone: 'ok' as const, label: 'Quiet' },
]

/** Module 6 FE-5/FE-6 and Module 8 FE-8 — the operational alert feed. */
export type AlertTone = 'danger' | 'warn' | 'info' | 'success'

export interface OperationalAlert {
  id: string
  tone: AlertTone
  category: 'Peak hour' | 'Food' | 'Staffing' | 'Tables' | 'Reservations'
  title: string
  detail: string
  time: string
}

export const operationalAlerts: OperationalAlert[] = [
  { id: 'AL-1', tone: 'danger', category: 'Peak hour', title: '8:00 PM – 10:00 PM is 96% booked', detail: 'Only 1 table left. Consider opening the private room.', time: '5 min ago' },
  { id: 'AL-2', tone: 'warn', category: 'Food', title: 'Chicken demand above forecast', detail: 'Shortage risk is Medium — prepare 15% extra for the dinner shift.', time: '18 min ago' },
  { id: 'AL-3', tone: 'warn', category: 'Staffing', title: 'Serving staff gap on the dinner shift', detail: '9 required, 7 rostered. Add 2 more serving staff.', time: '32 min ago' },
  { id: 'AL-4', tone: 'info', category: 'Reservations', title: '12 requests are awaiting approval', detail: 'Oldest request has been pending for 2 hours.', time: '45 min ago' },
  { id: 'AL-5', tone: 'success', category: 'Food', title: 'Wastage risk is under control', detail: 'Projected wastage is 4.1%, below the 6% target.', time: '1 hr ago' },
  { id: 'AL-6', tone: 'warn', category: 'Tables', title: 'Table B03 blocked for maintenance', detail: 'Blocked for the rest of today.', time: '2 hr ago' },
]

/** Module 6 FE-8 — dashboard recommendations. */
export const dashboardRecommendations = [
  'Open the private room for the 8:00 PM slot to absorb overflow demand.',
  'Add 2 serving staff to the evening shift to close the predicted gap.',
  'Increase chicken and rice preparation by 15% for tonight.',
  'Reduce seafood preparation — demand is tracking 22% below average.',
  'Promote the Family Feast deal; it converts best on weekend evenings.',
]

/** Module 6 FE-1 — today's headline numbers. */
export const dashboardKpis = [
  { key: 'total', label: 'Total Reservations', value: '1,258', delta: '12.5%', trend: 'up' as const, caption: 'from last 7 days' },
  { key: 'confirmed', label: 'Confirmed Bookings', value: '876', delta: '15.7%', trend: 'up' as const, caption: 'from last 7 days' },
  { key: 'cancelled', label: 'Cancelled Bookings', value: '96', delta: '5.1%', trend: 'down' as const, caption: 'from last 7 days' },
  { key: 'available', label: 'Available Tables', value: '11', delta: '2', trend: 'up' as const, caption: 'right now' },
  { key: 'booked', label: 'Booked Tables', value: '12', delta: '3', trend: 'up' as const, caption: 'right now' },
]

export const dashboardPeriods = ['Today', 'Last 7 days', 'Last 30 days']
