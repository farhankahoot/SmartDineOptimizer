/**
 * The `Setting` table is a small key/value store. Every key is declared here
 * with its default, so a fresh database and an upgraded one agree on shape.
 */
import { prisma } from '../db.js'

/** Module 8 FE-3 — system-wide switches only an administrator can change. */
export interface SystemSettings {
  maintenanceMode: boolean
  maintenanceMessage: string
  maintenanceEta: string
  /** Restricts console sign-in to administrators only. */
  adminOnlyLogin: boolean
  publicBookingEnabled: boolean
  trackingEnabled: boolean
  registrationEnabled: boolean
  sessionTimeoutMinutes: number
  minPasswordLength: number
  requireStrongPassword: boolean
  /** Blocks every write across the console. */
  readOnlyMode: boolean
}

export const defaultSystem: SystemSettings = {
  maintenanceMode: false,
  maintenanceMessage:
    'We are performing scheduled maintenance. Online booking will be back shortly — please call 0333 1234567 to reserve a table.',
  maintenanceEta: '',
  adminOnlyLogin: false,
  publicBookingEnabled: true,
  trackingEnabled: true,
  registrationEnabled: false,
  sessionTimeoutMinutes: 60,
  minPasswordLength: 8,
  requireStrongPassword: true,
  readOnlyMode: false,
}

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

/** Module 3 FE-5 plus the Module 1 booking constraints. */
export interface ReservationRules {
  /** Minutes before an unapproved request is auto-cancelled. 0 disables it. */
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
  /*
   * Auto-cancel window for unapproved requests, in minutes. Zero disables it,
   * which is the default: a guest who books at 8pm should not receive a
   * cancellation at 8:10pm because the floor was busy. A restaurant that does
   * want stale requests cleared can set a window that suits its service.
   */
  holdMinutes: 0,
  maxPartySize: 12,
  minPartySize: 1,
  advanceDays: 30,
  slotLengthMinutes: 120,
  preventDoubleBooking: true,
  requireApproval: true,
  allowSameDay: true,
  autoReleaseNoShow: true,
}

/** BO-12 — the prediction inputs the restaurant can tune. */
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

/** Module 8 FE-6/FE-7 — when the system sends automatic messages. */
export interface NotificationSettings {
  confirmOnApproval: boolean
  reminderHoursBefore: number
  reminderEnabled: boolean
  cancellationEnabled: boolean
  allowManualResend: boolean
}

export const defaultNotifications: NotificationSettings = {
  confirmOnApproval: true,
  reminderEnabled: true,
  reminderHoursBefore: 2,
  cancellationEnabled: true,
  allowManualResend: true,
}

/**
 * Landing-page copy the Control Centre can edit.
 *
 * Mirrors `LandingContent` in `src/data/platform.ts`, and every field is
 * rendered by the public page — a CMS field nothing reads lets an
 * administrator save copy that never appears, with no way to tell.
 */
export interface LandingContent {
  /** The gold second line of the hero headline. */
  heroTitleAccent: string
  /** The paragraph under the hero headline. */
  heroSubtitle: string
  /** The dark panel beside the questions section. */
  finalCtaTitle: string
  finalCtaBody: string
  /** Optional strip above the header. */
  announcementEnabled: boolean
  announcementText: string
}

export const defaultLanding: LandingContent = {
  heroTitleAccent: 'and the seat you want.',
  heroSubtitle:
    'See which tables are free tonight, choose the one you want from the floor plan, and keep a reference you can check any time. No phone calls, no waiting to hear back.',
  finalCtaTitle: 'Ready when you are',
  finalCtaBody: 'Pick your table and we will hold it while the restaurant confirms.',
  announcementEnabled: false,
  announcementText: 'Now taking bookings for the weekend — the terrace fills up early.',
}

export const settingDefaults = {
  'system.controls': defaultSystem,
  'restaurant.profile': defaultProfile,
  'restaurant.hours': defaultHours,
  'reservation.rules': defaultRules,
  'prediction.settings': defaultPrediction,
  'notification.settings': defaultNotifications,
  'landing.content': defaultLanding,
} as const

export type SettingKey = keyof typeof settingDefaults

/** Reads a setting, falling back to the declared default if the row is absent. */
export async function getSetting<K extends SettingKey>(
  key: K,
): Promise<(typeof settingDefaults)[K]> {
  const row = await prisma.setting.findUnique({ where: { key } })
  if (!row) return settingDefaults[key]
  try {
    const parsed: unknown = JSON.parse(row.value)
    // Objects are merged over the default so a key added later is never
    // missing; arrays (the opening hours) replace it wholesale.
    const value = Array.isArray(parsed)
      ? parsed
      : { ...settingDefaults[key], ...(parsed as object) }
    return value as (typeof settingDefaults)[K]
  } catch {
    return settingDefaults[key]
  }
}

export async function setSetting<K extends SettingKey>(
  key: K,
  value: (typeof settingDefaults)[K],
): Promise<void> {
  const json = JSON.stringify(value)
  await prisma.setting.upsert({
    where: { key },
    create: { key, value: json },
    update: { value: json },
  })
}

export const getSystem = () => getSetting('system.controls')
export const getRules = () => getSetting('reservation.rules')
