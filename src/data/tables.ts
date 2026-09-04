/** Module 3 FE-6 — the six states a table can be in. */
export type TableStatus =
  | 'Available'
  | 'Reserved'
  | 'Booked'
  | 'Occupied'
  | 'Blocked'
  | 'Selected'
  | 'Unavailable'

export type TableShape = 'round' | 'rect' | 'square'
export type TableType = 'Couple' | 'Family' | 'Group' | 'Private'

/** Module 3 FE-2 — seating sections a table can belong to. */
export type TableSection = 'Main Hall' | 'Window Side' | 'Outdoor Terrace' | 'Private Room'

export const tableSections: TableSection[] = [
  'Main Hall',
  'Window Side',
  'Outdoor Terrace',
  'Private Room',
]

export const tableStatuses: TableStatus[] = [
  'Available',
  'Reserved',
  'Booked',
  'Occupied',
  'Blocked',
  'Unavailable',
]

export const tableTypes: TableType[] = ['Couple', 'Family', 'Group', 'Private']
export const tableShapes: TableShape[] = ['round', 'rect', 'square']

export interface FloorTable {
  id: string
  seats: number
  status: TableStatus
  shape: TableShape
  type: TableType
  section: TableSection
  /** Percentage position within the floor-plan canvas. */
  x: number
  y: number
  w: number
  h: number
}

/** Admin floor plan — 8 tables laid out as in the Table Management mockup. */
export const adminFloorTables: FloorTable[] = [
  { id: 'A01', section: 'Window Side', seats: 2, status: 'Available', shape: 'round', type: 'Couple', x: 12, y: 21, w: 11, h: 30 },
  { id: 'A02', section: 'Window Side', seats: 4, status: 'Available', shape: 'square', type: 'Family', x: 28, y: 21, w: 12, h: 30 },
  { id: 'A03', section: 'Main Hall', seats: 6, status: 'Occupied', shape: 'round', type: 'Group', x: 45.5, y: 19, w: 13, h: 34 },
  { id: 'B01', section: 'Main Hall', seats: 8, status: 'Reserved', shape: 'rect', type: 'Group', x: 68, y: 20, w: 21, h: 30 },
  { id: 'B02', section: 'Main Hall', seats: 4, status: 'Available', shape: 'round', type: 'Family', x: 12, y: 62, w: 11, h: 30 },
  { id: 'B03', section: 'Main Hall', seats: 6, status: 'Reserved', shape: 'rect', type: 'Group', x: 28.5, y: 62, w: 16, h: 30 },
  { id: 'C01', section: 'Outdoor Terrace', seats: 4, status: 'Blocked', shape: 'square', type: 'Family', x: 53, y: 62, w: 12, h: 30 },
  { id: 'C02', section: 'Outdoor Terrace', seats: 2, status: 'Available', shape: 'square', type: 'Couple', x: 76, y: 62, w: 11, h: 30 },
]

/** Guest-facing floor plan — 17 tables, T12 pre-selected, as in the public mockup. */
export const publicFloorTables: FloorTable[] = [
  { id: 'T1', section: 'Window Side', seats: 4, status: 'Available', shape: 'rect', type: 'Family', x: 7, y: 12, w: 12, h: 17 },
  { id: 'T2', section: 'Window Side', seats: 4, status: 'Available', shape: 'rect', type: 'Family', x: 21, y: 12, w: 12, h: 17 },
  { id: 'T3', section: 'Window Side', seats: 4, status: 'Unavailable', shape: 'square', type: 'Family', x: 35, y: 12, w: 11, h: 15 },
  { id: 'T4', section: 'Window Side', seats: 4, status: 'Available', shape: 'round', type: 'Family', x: 63, y: 11, w: 10, h: 17 },
  { id: 'T5', section: 'Window Side', seats: 4, status: 'Available', shape: 'round', type: 'Family', x: 76, y: 11, w: 10, h: 17 },
  { id: 'T6', section: 'Main Hall', seats: 2, status: 'Reserved', shape: 'round', type: 'Couple', x: 13, y: 37, w: 9.5, h: 15 },
  { id: 'T7', section: 'Main Hall', seats: 2, status: 'Reserved', shape: 'round', type: 'Couple', x: 29, y: 37, w: 9.5, h: 15 },
  { id: 'T8', section: 'Main Hall', seats: 2, status: 'Available', shape: 'round', type: 'Couple', x: 45, y: 37, w: 9.5, h: 15 },
  { id: 'T9', section: 'Main Hall', seats: 4, status: 'Unavailable', shape: 'square', type: 'Family', x: 65, y: 36, w: 11, h: 13 },
  { id: 'T10', section: 'Main Hall', seats: 4, status: 'Unavailable', shape: 'square', type: 'Family', x: 65, y: 52, w: 11, h: 13 },
  { id: 'T11', section: 'Main Hall', seats: 4, status: 'Available', shape: 'rect', type: 'Family', x: 9, y: 55, w: 11, h: 15 },
  { id: 'T12', section: 'Window Side', seats: 4, status: 'Selected', shape: 'rect', type: 'Family', x: 27, y: 55, w: 11, h: 15 },
  { id: 'T13', section: 'Main Hall', seats: 4, status: 'Available', shape: 'rect', type: 'Family', x: 44, y: 55, w: 11, h: 15 },
  { id: 'T14', section: 'Outdoor Terrace', seats: 4, status: 'Unavailable', shape: 'rect', type: 'Family', x: 8, y: 76, w: 10, h: 14 },
  { id: 'T15', section: 'Outdoor Terrace', seats: 6, status: 'Unavailable', shape: 'rect', type: 'Group', x: 22, y: 76, w: 12, h: 14 },
  { id: 'T16', section: 'Outdoor Terrace', seats: 4, status: 'Reserved', shape: 'rect', type: 'Family', x: 39, y: 76, w: 11, h: 14 },
  { id: 'T17', section: 'Private Room', seats: 6, status: 'Available', shape: 'rect', type: 'Private', x: 69, y: 80, w: 14, h: 14 },
]

export const tableStats = [
  { key: 'total', label: 'Total Tables', value: '28', caption: 'All tables in restaurant', color: '#C99A3E' },
  { key: 'available', label: 'Available Tables', value: '11', caption: '39% of total', color: '#2E7D32' },
  { key: 'reserved', label: 'Reserved Tables', value: '12', caption: '43% of total', color: '#1B62B5' },
  { key: 'blocked', label: 'Blocked Tables', value: '5', caption: '18% of total', color: '#E4572E' },
  { key: 'slots', label: 'Active Time Slots', value: '4', caption: 'For selected day', color: '#7B3FBF' },
]

export const quickSummary = [
  { label: 'Peak reservation slot', value: '8:00 PM – 10:00 PM', icon: 'clock' as const },
  { label: 'Tables blocked today', value: '5', icon: 'lock' as const },
  { label: 'Available family tables', value: '6', icon: 'users' as const },
  { label: 'Next fully booked slot', value: '8:00 PM – 10:00 PM', icon: 'clock' as const },
]

export const slotAlerts = [
  { tone: 'warn' as const, title: '8:00 PM to 10:00 PM almost full', detail: 'Only 1 table left', time: '10 min ago' },
  { tone: 'danger' as const, title: 'Table B03 blocked for maintenance', detail: 'Blocked for today', time: '20 min ago' },
  { tone: 'success' as const, title: '6 family tables available tonight', detail: 'Across all open slots', time: '30 min ago' },
]
