/** Module 6 FE-7 — the five report families the proposal names. */
export type ReportType =
  | 'Reservations'
  | 'Revenue'
  | 'Food Wastage'
  | 'Staff Requirement'
  | 'Sales Forecast'

export type ReportPeriod = 'Daily' | 'Weekly' | 'Monthly'

export const reportTypes: ReportType[] = [
  'Reservations',
  'Revenue',
  'Food Wastage',
  'Staff Requirement',
  'Sales Forecast',
]

export const reportPeriods: ReportPeriod[] = ['Daily', 'Weekly', 'Monthly']

export interface ReportRow {
  period: string
  reservations: number
  guests: number
  confirmed: number
  cancelled: number
  revenue: number
  wastagePct: number
  staffRequired: number
  forecastRevenue: number
}

const daily: ReportRow[] = [
  { period: 'Mon, 19 May 2025', reservations: 38, guests: 142, confirmed: 31, cancelled: 4, revenue: 182000, wastagePct: 5.2, staffRequired: 15, forecastRevenue: 178000 },
  { period: 'Tue, 20 May 2025', reservations: 34, guests: 128, confirmed: 28, cancelled: 3, revenue: 164000, wastagePct: 4.8, staffRequired: 14, forecastRevenue: 170000 },
  { period: 'Wed, 21 May 2025', reservations: 42, guests: 168, confirmed: 36, cancelled: 3, revenue: 205000, wastagePct: 4.1, staffRequired: 16, forecastRevenue: 198000 },
  { period: 'Thu, 22 May 2025', reservations: 47, guests: 186, confirmed: 41, cancelled: 4, revenue: 221000, wastagePct: 3.9, staffRequired: 17, forecastRevenue: 216000 },
  { period: 'Fri, 23 May 2025', reservations: 56, guests: 224, confirmed: 49, cancelled: 5, revenue: 268000, wastagePct: 4.6, staffRequired: 19, forecastRevenue: 259000 },
  { period: 'Sat, 24 May 2025', reservations: 63, guests: 268, confirmed: 57, cancelled: 4, revenue: 312000, wastagePct: 5.8, staffRequired: 21, forecastRevenue: 305000 },
  { period: 'Sun, 25 May 2025', reservations: 58, guests: 246, confirmed: 52, cancelled: 5, revenue: 291000, wastagePct: 5.1, staffRequired: 20, forecastRevenue: 288000 },
]

const weekly: ReportRow[] = [
  { period: 'Week 17 · 21–27 Apr', reservations: 268, guests: 1064, confirmed: 231, cancelled: 24, revenue: 1284000, wastagePct: 5.6, staffRequired: 18, forecastRevenue: 1260000 },
  { period: 'Week 18 · 28 Apr–4 May', reservations: 284, guests: 1128, confirmed: 246, cancelled: 22, revenue: 1362000, wastagePct: 5.1, staffRequired: 18, forecastRevenue: 1340000 },
  { period: 'Week 19 · 5–11 May', reservations: 301, guests: 1212, confirmed: 264, cancelled: 21, revenue: 1448000, wastagePct: 4.7, staffRequired: 19, forecastRevenue: 1425000 },
  { period: 'Week 20 · 12–18 May', reservations: 317, guests: 1284, confirmed: 279, cancelled: 23, revenue: 1531000, wastagePct: 4.9, staffRequired: 19, forecastRevenue: 1502000 },
  { period: 'Week 21 · 19–25 May', reservations: 338, guests: 1362, confirmed: 294, cancelled: 28, revenue: 1643000, wastagePct: 4.8, staffRequired: 20, forecastRevenue: 1614000 },
]

const monthly: ReportRow[] = [
  { period: 'January 2025', reservations: 1042, guests: 4128, confirmed: 902, cancelled: 88, revenue: 4980000, wastagePct: 6.4, staffRequired: 17, forecastRevenue: 4890000 },
  { period: 'February 2025', reservations: 986, guests: 3902, confirmed: 856, cancelled: 79, revenue: 4712000, wastagePct: 6.1, staffRequired: 17, forecastRevenue: 4650000 },
  { period: 'March 2025', reservations: 1128, guests: 4520, confirmed: 984, cancelled: 92, revenue: 5406000, wastagePct: 5.7, staffRequired: 18, forecastRevenue: 5320000 },
  { period: 'April 2025', reservations: 1204, guests: 4816, confirmed: 1052, cancelled: 96, revenue: 5782000, wastagePct: 5.3, staffRequired: 19, forecastRevenue: 5690000 },
  { period: 'May 2025 (to date)', reservations: 1258, guests: 5064, confirmed: 1108, cancelled: 96, revenue: 6068000, wastagePct: 4.9, staffRequired: 20, forecastRevenue: 5975000 },
]

export const reportData: Record<ReportPeriod, ReportRow[]> = { Daily: daily, Weekly: weekly, Monthly: monthly }

export interface SavedReport {
  id: string
  name: string
  type: ReportType
  period: ReportPeriod
  generated: string
  generatedBy: string
  format: 'PDF' | 'CSV' | 'XLSX'
}

export const savedReports: SavedReport[] = [
  { id: 'RP-014', name: 'Weekly reservation summary', type: 'Reservations', period: 'Weekly', generated: '24 May 2025 · 08:15 AM', generatedBy: 'Admin User', format: 'PDF' },
  { id: 'RP-013', name: 'May revenue statement', type: 'Revenue', period: 'Monthly', generated: '23 May 2025 · 06:40 PM', generatedBy: 'Hira Azmat', format: 'XLSX' },
  { id: 'RP-012', name: 'Food wastage review', type: 'Food Wastage', period: 'Weekly', generated: '22 May 2025 · 11:02 AM', generatedBy: 'Admin User', format: 'CSV' },
  { id: 'RP-011', name: 'Dinner shift staffing plan', type: 'Staff Requirement', period: 'Daily', generated: '22 May 2025 · 09:30 AM', generatedBy: 'Haroon Ejaz', format: 'PDF' },
  { id: 'RP-010', name: 'Q2 sales forecast', type: 'Sales Forecast', period: 'Monthly', generated: '20 May 2025 · 04:12 PM', generatedBy: 'Farhan Imtiaz', format: 'XLSX' },
]

/** Which columns each report family shows. */
export const reportColumns: Record<ReportType, (keyof ReportRow)[]> = {
  Reservations: ['reservations', 'guests', 'confirmed', 'cancelled'],
  Revenue: ['revenue', 'reservations', 'guests'],
  'Food Wastage': ['wastagePct', 'guests', 'reservations'],
  'Staff Requirement': ['staffRequired', 'guests', 'reservations'],
  'Sales Forecast': ['forecastRevenue', 'revenue', 'reservations'],
}

export const columnLabels: Record<keyof ReportRow, string> = {
  period: 'Period',
  reservations: 'Reservations',
  guests: 'Guests',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  revenue: 'Revenue',
  wastagePct: 'Wastage %',
  staffRequired: 'Staff Required',
  forecastRevenue: 'Forecast Revenue',
}

export function formatCell(key: keyof ReportRow, value: string | number): string {
  if (typeof value !== 'number') return String(value)
  if (key === 'revenue' || key === 'forecastRevenue') return `₨${value.toLocaleString()}`
  if (key === 'wastagePct') return `${value.toFixed(1)}%`
  return value.toLocaleString()
}
