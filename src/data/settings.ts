/**
 * BO-12 / LI-7 — everything a new restaurant must configure to adopt the
 * system: profile, hours, reservation rules, dashboard and prediction inputs.
 */
export interface RestaurantProfile {
  name: string
  tagline: string
  cuisine: string
  phone: string
  email: string
  address: string
  city: string
  currency: string
  timezone: string
}

export const defaultProfile: RestaurantProfile = {
  name: 'Asian Wok',
  tagline: 'by MONAL',
  cuisine: 'Pan Asian',
  phone: '0333 1234567',
  email: 'reservations@asianwok.pk',
  address: 'Pir Sohawa Road, Margalla Hills',
  city: 'Islamabad',
  currency: 'PKR (₨)',
  timezone: 'Asia/Karachi (PKT)',
}

export const currencies = ['PKR (₨)', 'INR (₹)', 'USD ($)', 'AED (د.إ)', 'GBP (£)']
export const timezones = ['Asia/Karachi (PKT)', 'Asia/Kolkata (IST)', 'Asia/Dubai (GST)', 'UTC']
export const cuisines = ['Pan Asian', 'Chinese', 'Thai', 'Continental', 'Pakistani', 'Fusion']

export interface DayHours {
  day: string
  open: string
  close: string
  closed: boolean
}

export const defaultHours: DayHours[] = [
  { day: 'Monday', open: '12:00 PM', close: '11:59 PM', closed: false },
  { day: 'Tuesday', open: '12:00 PM', close: '11:59 PM', closed: false },
  { day: 'Wednesday', open: '12:00 PM', close: '11:59 PM', closed: false },
  { day: 'Thursday', open: '12:00 PM', close: '11:59 PM', closed: false },
  { day: 'Friday', open: '12:00 PM', close: '11:59 PM', closed: false },
  { day: 'Saturday', open: '12:00 PM', close: '11:59 PM', closed: false },
  { day: 'Sunday', open: '12:00 PM', close: '11:00 PM', closed: false },
]

export const timeOptions = [
  '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
  '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM', '11:59 PM',
]

/** Module 3 FE-5 and Module 1 booking constraints. */
export interface ReservationRules {
  holdMinutes: number
  maxPartySize: number
  minPartySize: number
  advanceDays: number
  slotLengthMinutes: number
  preventDoubleBooking: boolean
  requireApproval: boolean
  allowSameDay: boolean
  autoReleaseNoShow: boolean
}

export const defaultRules: ReservationRules = {
  holdMinutes: 10,
  maxPartySize: 12,
  minPartySize: 1,
  advanceDays: 30,
  slotLengthMinutes: 120,
  preventDoubleBooking: true,
  requireApproval: true,
  allowSameDay: true,
  autoReleaseNoShow: true,
}

/** BO-12 — dashboard + prediction model inputs the restaurant can tune. */
export interface PredictionSettings {
  footfallModel: string
  revenueModel: string
  trainingWindow: string
  refreshInterval: string
  confidenceThreshold: number
  wastageTargetPct: number
  shortageBufferPct: number
  guestsPerServer: number
  guestsPerChef: number
}

export const defaultPrediction: PredictionSettings = {
  footfallModel: 'Random Forest',
  revenueModel: 'Gradient Boosting (XGBoost)',
  trainingWindow: 'Last 12 months',
  refreshInterval: 'Every 30 minutes',
  confidenceThreshold: 75,
  wastageTargetPct: 6,
  shortageBufferPct: 15,
  guestsPerServer: 20,
  guestsPerChef: 30,
}

export const models = ['Random Forest', 'Gradient Boosting (XGBoost)', 'Linear Regression', 'ARIMA / Time Series']
export const trainingWindows = ['Last 3 months', 'Last 6 months', 'Last 12 months', 'All available data']
export const refreshIntervals = ['Every 15 minutes', 'Every 30 minutes', 'Hourly', 'Daily']

/** Module 7 — data-management surface for the centralised database. */
export const dataSummary = [
  { label: 'Reservation records', value: '1,258', detail: 'Since January 2025' },
  { label: 'Customer profiles', value: '842', detail: 'Unique guests' },
  { label: 'Table records', value: '28', detail: 'Across 4 sections' },
  { label: 'Time slots', value: '6', detail: 'Configured per day' },
  { label: 'Food deals', value: '6', detail: '5 active' },
  { label: 'Staff records', value: '18', detail: 'Across 3 shifts' },
  { label: 'Prediction outputs', value: '4,120', detail: 'Stored forecast rows' },
  { label: 'Last backup', value: '24 May 2025', detail: '02:00 AM · automatic' },
]
