/** Feature toggles for the modules that actually exist in this build. */
export interface FeatureFlag {
  id: string
  name: string
  description: string
  enabled: boolean
  /** The console area it controls, so the effect is explicit. */
  area: 'Public' | 'Console' | 'Analytics' | 'Messaging'
  /** Backend endpoint that would persist the change. */
  endpoint: string
}

export const featureFlags: FeatureFlag[] = [
  { id: 'FF-01', name: 'Online reservations', description: 'Guests can submit booking requests from the public site.', enabled: true, area: 'Public', endpoint: 'PATCH /admin/feature-flags/online-reservations' },
  { id: 'FF-02', name: 'Booking status tracker', description: 'Guests can look up a reservation with their booking reference.', enabled: true, area: 'Public', endpoint: 'PATCH /admin/feature-flags/booking-tracker' },
  { id: 'FF-03', name: 'Restaurant showcase', description: 'Shows the Pakistan restaurant carousel on the landing page.', enabled: true, area: 'Public', endpoint: 'PATCH /admin/feature-flags/restaurant-showcase' },
  { id: 'FF-04', name: 'Table management', description: 'Floor plan, table records and the availability checker.', enabled: true, area: 'Console', endpoint: 'PATCH /admin/feature-flags/table-management' },
  { id: 'FF-05', name: 'Food deals', description: 'Occasion-based deal management and customer special requests.', enabled: true, area: 'Console', endpoint: 'PATCH /admin/feature-flags/food-deals' },
  { id: 'FF-06', name: 'Staff management', description: 'Staff records, shift availability and allocation planning.', enabled: true, area: 'Console', endpoint: 'PATCH /admin/feature-flags/staff-management' },
  { id: 'FF-07', name: 'Prediction dashboard', description: 'Footfall, revenue, food and staffing forecasts.', enabled: true, area: 'Analytics', endpoint: 'PATCH /admin/feature-flags/prediction' },
  { id: 'FF-08', name: 'Reports & exports', description: 'Daily, weekly and monthly reports with PDF/CSV export.', enabled: true, area: 'Analytics', endpoint: 'PATCH /admin/feature-flags/reports' },
  { id: 'FF-09', name: 'Email notifications', description: 'Confirmation, reminder and cancellation email over SMTP.', enabled: true, area: 'Messaging', endpoint: 'PATCH /admin/feature-flags/email' },
  { id: 'FF-10', name: 'SMS notifications', description: 'Requires an SMS gateway API key before it can send.', enabled: false, area: 'Messaging', endpoint: 'PATCH /admin/feature-flags/sms' },
  { id: 'FF-11', name: 'WhatsApp notifications', description: 'Requires WhatsApp Business API credentials before it can send.', enabled: false, area: 'Messaging', endpoint: 'PATCH /admin/feature-flags/whatsapp' },
]

/* -------------------------------------------------------------- audit log */

export type AuditCategory =
  | 'User'
  | 'Restaurant'
  | 'System'
  | 'Feature'
  | 'Content'
  | 'Security'
  | 'Reservation'

export interface AuditEntry {
  id: string
  at: string
  actor: string
  action: string
  target: string
  category: AuditCategory
  result: 'Success' | 'Failed'
}

export const auditSeed: AuditEntry[] = [
  { id: 'AL-1042', at: '24 May 2025 · 12:48 PM', actor: 'Admin User', action: 'Confirmed reservation', target: 'RES-2025-1002', category: 'Reservation', result: 'Success' },
  { id: 'AL-1041', at: '24 May 2025 · 11:20 AM', actor: 'Admin User', action: 'Blocked account', target: 'bilal.khan@asianwok.pk', category: 'User', result: 'Success' },
  { id: 'AL-1040', at: '24 May 2025 · 10:05 AM', actor: 'Admin User', action: 'Enabled feature flag', target: 'Restaurant showcase', category: 'Feature', result: 'Success' },
  { id: 'AL-1039', at: '23 May 2025 · 06:12 PM', actor: 'Hira Azmat', action: 'Updated reservation', target: 'RES-2025-1014', category: 'Reservation', result: 'Success' },
  { id: 'AL-1038', at: '23 May 2025 · 04:40 PM', actor: 'Admin User', action: 'Added showcase restaurant', target: 'Highland Cafe Murree', category: 'Restaurant', result: 'Success' },
  { id: 'AL-1037', at: '23 May 2025 · 02:15 PM', actor: 'Admin User', action: 'Changed reservation rules', target: 'Table hold time → 10 min', category: 'System', result: 'Success' },
  { id: 'AL-1036', at: '23 May 2025 · 09:31 AM', actor: 'Haroon Ejaz', action: 'Failed sign-in attempt', target: 'floor@asianwok.pk', category: 'Security', result: 'Failed' },
  { id: 'AL-1035', at: '22 May 2025 · 08:02 PM', actor: 'Admin User', action: 'Updated landing hero copy', target: 'Landing page', category: 'Content', result: 'Success' },
  { id: 'AL-1034', at: '22 May 2025 · 03:44 PM', actor: 'Admin User', action: 'Invited user', target: 'sana.riaz@asianwok.pk', category: 'User', result: 'Success' },
  { id: 'AL-1033', at: '22 May 2025 · 11:07 AM', actor: 'Farhan Imtiaz', action: 'Exported report', target: 'May revenue statement', category: 'System', result: 'Success' },
]

/* ------------------------------------------------------ admin notifications */

export type NotificationTone = 'info' | 'warning' | 'danger' | 'success'

export interface AdminNotification {
  id: string
  tone: NotificationTone
  title: string
  detail: string
  at: string
  read: boolean
  /** Where the admin should go to act on it. */
  to?: string
}

export const notificationSeed: AdminNotification[] = [
  { id: 'AN-1', tone: 'warning', title: 'Restaurant awaiting approval', detail: 'Highland Cafe Murree was submitted to the showcase and is pending review.', at: '18 min ago', read: false, to: '/superadmin/restaurants' },
  { id: 'AN-2', tone: 'danger', title: 'Messaging channel not configured', detail: 'SMS and WhatsApp notifications are disabled — API credentials are missing.', at: '1 hr ago', read: false, to: '/superadmin/system' },
  { id: 'AN-3', tone: 'info', title: 'New user invitation pending', detail: 'sana.riaz@asianwok.pk has not accepted their invitation yet.', at: '3 hr ago', read: false, to: '/superadmin/users' },
  { id: 'AN-4', tone: 'warning', title: 'Account blocked', detail: 'bilal.khan@asianwok.pk was blocked by an administrator.', at: 'Yesterday', read: true, to: '/superadmin/users' },
  { id: 'AN-5', tone: 'success', title: 'Backup completed', detail: 'Nightly database backup finished at 02:00 AM.', at: 'Yesterday', read: true, to: '/superadmin/system' },
  { id: 'AN-6', tone: 'info', title: 'Peak-hour alert raised', detail: '8:00 PM – 10:00 PM reached 96% utilisation on the operations dashboard.', at: '2 days ago', read: true, to: '/admin' },
]

/* ---------------------------------------------------------- system health */

export type HealthState = 'Operational' | 'Degraded' | 'Not configured' | 'Down'

export interface HealthCheck {
  id: string
  name: string
  state: HealthState
  detail: string
  /** The endpoint a real deployment would poll. */
  endpoint: string
}

/**
 * These are declared states from configuration, not live probes — nothing here
 * is polled, so the UI labels it as such rather than implying real uptime.
 */
export const healthChecks: HealthCheck[] = [
  { id: 'H-1', name: 'Web application', state: 'Operational', detail: 'React front end served from the origin.', endpoint: 'GET /health/app' },
  { id: 'H-2', name: 'Database (MySQL)', state: 'Not configured', detail: 'No database connection is wired to this build.', endpoint: 'GET /health/db' },
  { id: 'H-3', name: 'REST API', state: 'Not configured', detail: 'Screens read from the local mock data layer.', endpoint: 'GET /health/api' },
  { id: 'H-4', name: 'Authentication', state: 'Degraded', detail: 'Sign-in is validated client-side; move to a server session before launch.', endpoint: 'GET /health/auth' },
  { id: 'H-5', name: 'Media storage', state: 'Not configured', detail: 'Uploaded images are held in browser memory only.', endpoint: 'GET /health/storage' },
  { id: 'H-6', name: 'Prediction service', state: 'Not configured', detail: 'Forecasts are fixtures; the Python service is not connected.', endpoint: 'GET /health/prediction' },
  { id: 'H-7', name: 'Email (SMTP)', state: 'Not configured', detail: 'Outgoing mail requires SMTP credentials.', endpoint: 'GET /health/smtp' },
]

/* ------------------------------------------------------- active sessions */

export interface AdminSession {
  id: string
  user: string
  email: string
  role: string
  device: string
  location: string
  startedAt: string
  current: boolean
}

export const sessionSeed: AdminSession[] = [
  { id: 'SE-1', user: 'Admin User', email: 'admin@asianwok.pk', role: 'Administrator', device: 'Chrome · Windows', location: 'Islamabad, PK', startedAt: 'Today, 09:12 AM', current: true },
  { id: 'SE-2', user: 'Hira Azmat', email: 'manager@asianwok.pk', role: 'Manager', device: 'Safari · macOS', location: 'Lahore, PK', startedAt: 'Today, 08:44 AM', current: false },
  { id: 'SE-3', user: 'Haroon Ejaz', email: 'floor@asianwok.pk', role: 'Staff', device: 'Chrome · Android', location: 'Islamabad, PK', startedAt: 'Today, 07:58 AM', current: false },
  { id: 'SE-4', user: 'Ali Ammar', email: 'ali.ammar@asianwok.pk', role: 'Manager', device: 'Edge · Windows', location: 'Rawalpindi, PK', startedAt: 'Yesterday, 08:15 PM', current: false },
]

/* --------------------------------------------------------- landing content */

export interface LandingContent {
  heroBadge: string
  heroTitleTop: string
  heroTitleAccent: string
  heroSubtitle: string
  primaryCtaLabel: string
  secondaryCtaLabel: string
  showcaseEyebrow: string
  showcaseTitle: string
  showcaseLead: string
  finalCtaTitle: string
  finalCtaBody: string
  announcementEnabled: boolean
  announcementText: string
}

export const defaultLandingContent: LandingContent = {
  heroBadge: 'Reservations + machine-learning operations planning',
  heroTitleTop: 'Fill every table.',
  heroTitleAccent: 'Plan every shift.',
  heroSubtitle:
    'SmartDine Optimizer replaces phone calls, WhatsApp messages and paper records with structured online booking — then forecasts footfall, revenue, food demand and staffing so your team plans service before it starts.',
  primaryCtaLabel: 'Reserve a table',
  secondaryCtaLabel: 'Explore the platform',
  showcaseEyebrow: 'Across Pakistan',
  showcaseTitle: 'Restaurants building smarter service',
  showcaseLead:
    'From the Margalla foothills to the Karachi seafront — a growing directory of dining rooms across Pakistan, curated from the admin console.',
  finalCtaTitle: 'Ready to see it running?',
  finalCtaBody:
    'Book a table the way your guests would, or sign in to the console and walk through the reservation, table, deal, staffing and prediction modules.',
  announcementEnabled: false,
  announcementText: 'New: the Pakistan restaurant showcase is now live on the landing page.',
}
