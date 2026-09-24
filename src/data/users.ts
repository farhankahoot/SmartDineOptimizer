/**
 * Module 8 FE-2 names admin, manager and staff. `superadmin` sits above those
 * three and owns the platform control centre (users, content, system, security).
 */
export type Role = 'superadmin' | 'admin' | 'manager' | 'staff'

export const roleLabels: Record<Role, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrator',
  manager: 'Manager',
  staff: 'Staff',
}

export const roleDescriptions: Record<Role, string> = {
  superadmin: 'Platform owner. Controls users, roles, landing-page content, system availability and security.',
  admin: 'Runs the restaurant console end to end, including settings and user management.',
  manager: 'Runs day-to-day service across every module; reads settings but cannot change them.',
  staff: 'Front-of-house access to reservations, tables, slots, deals and messaging.',
}

/** Roles that may open the Super Admin control centre. */
export const platformRoles: Role[] = ['superadmin']

/**
 * Module 8 FE-3/FE-4: every capability the console gates on. `view:*` controls
 * whether a route is reachable, `manage:*` whether its records can be changed.
 */
export type Permission =
  | 'view:dashboard'
  | 'view:reservations'
  | 'manage:reservations'
  | 'view:tables'
  | 'manage:tables'
  | 'view:slots'
  | 'manage:slots'
  | 'view:deals'
  | 'manage:deals'
  | 'view:staff'
  | 'manage:staff'
  | 'view:prediction'
  | 'view:reports'
  | 'view:communication'
  | 'manage:communication'
  | 'view:settings'
  | 'manage:settings'
  | 'manage:users'
  /* ---- platform control centre ---- */
  | 'view:platform'
  | 'manage:platform-users'
  | 'manage:roles'
  | 'manage:content'
  | 'manage:system'
  | 'manage:features'
  | 'view:health'
  | 'manage:security'
  | 'view:audit'

const managerPermissions: Permission[] = [
  'view:dashboard',
  'view:reservations',
  'manage:reservations',
  'view:tables',
  'manage:tables',
  'view:slots',
  'manage:slots',
  'view:deals',
  'manage:deals',
  'view:staff',
  'manage:staff',
  'view:prediction',
  'view:reports',
  'view:communication',
  'manage:communication',
  'view:settings',
]

const staffPermissions: Permission[] = [
  'view:dashboard',
  'view:reservations',
  'manage:reservations',
  'view:tables',
  'view:slots',
  'view:deals',
  'view:staff',
  'view:communication',
]

/** Every capability the console gates on, in matrix order. */
export const allPermissions: Permission[] = [
  'view:dashboard',
  'view:reservations',
  'manage:reservations',
  'view:tables',
  'manage:tables',
  'view:slots',
  'manage:slots',
  'view:deals',
  'manage:deals',
  'view:staff',
  'manage:staff',
  'view:prediction',
  'view:reports',
  'view:communication',
  'manage:communication',
  'view:settings',
  'manage:settings',
  'manage:users',
  'view:platform',
  'manage:platform-users',
  'manage:roles',
  'manage:content',
  'manage:system',
  'manage:features',
  'view:health',
  'manage:security',
  'view:audit',
]

/** Capabilities reserved for the platform tier. */
const PLATFORM_ONLY = new Set<Permission>([
  'manage:platform-users',
  'manage:roles',
  'manage:content',
  'manage:system',
  'manage:features',
  'view:health',
  'manage:security',
  'view:audit',
])

/** The restaurant administrator runs the console but not the platform tier. */
const adminPermissions: Permission[] = allPermissions.filter(
  (p) => !p.startsWith('view:platform') && !PLATFORM_ONLY.has(p),
)

export const rolePermissions: Record<Role, Permission[] | 'all'> = {
  superadmin: 'all',
  admin: adminPermissions,
  manager: managerPermissions,
  staff: staffPermissions,
}

export const permissionLabels: Record<Permission, string> = {
  'view:dashboard': 'Operations dashboard',
  'view:reservations': 'Reservations — view',
  'manage:reservations': 'Reservations — manage',
  'view:tables': 'Tables — view',
  'manage:tables': 'Tables — manage',
  'view:slots': 'Time slots — view',
  'manage:slots': 'Time slots — manage',
  'view:deals': 'Food deals — view',
  'manage:deals': 'Food deals — manage',
  'view:staff': 'Staff — view',
  'manage:staff': 'Staff — manage',
  'view:prediction': 'Prediction dashboard',
  'view:reports': 'Reports & exports',
  'view:communication': 'Communication — view',
  'manage:communication': 'Communication — send',
  'view:settings': 'Settings — view',
  'manage:settings': 'Settings — manage',
  'manage:users': 'Console users',
  'view:platform': 'Platform control centre',
  'manage:platform-users': 'Platform users',
  'manage:roles': 'Roles & permissions',
  'manage:content': 'Landing page content',
  'manage:system': 'System controls',
  'manage:features': 'Feature flags',
  'view:health': 'System health',
  'manage:security': 'Security settings',
  'view:audit': 'Audit log',
}

export function can(role: Role, permission: Permission): boolean {
  const granted = rolePermissions[role]
  return granted === 'all' || granted.includes(permission)
}

export type UserStatus = 'Active' | 'Invited' | 'Suspended'

export interface SystemUser {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  status: UserStatus
  lastActive: string
  /** Demo password — a real deployment authenticates server-side. */
  password: string
}

export const systemUsers: SystemUser[] = [
  { id: 'U-00', name: 'Farhan Imtiaz', email: 'super@asianwok.pk', phone: '+92 300 900 1100', role: 'superadmin', status: 'Active', lastActive: 'Today, 01:02 PM', password: 'super123' },
  { id: 'U-01', name: 'Admin User', email: 'admin@asianwok.pk', phone: '+92 300 111 2233', role: 'admin', status: 'Active', lastActive: 'Today, 12:45 PM', password: 'admin123' },
  { id: 'U-02', name: 'Hira Azmat', email: 'manager@asianwok.pk', phone: '+92 301 445 8899', role: 'manager', status: 'Active', lastActive: 'Today, 11:02 AM', password: 'manager123' },
  { id: 'U-03', name: 'Haroon Ejaz', email: 'floor@asianwok.pk', phone: '+92 333 220 4411', role: 'staff', status: 'Active', lastActive: 'Today, 10:20 AM', password: 'staff123' },
  { id: 'U-04', name: 'Ali Ammar', email: 'ali.ammar@asianwok.pk', phone: '+92 321 909 7766', role: 'manager', status: 'Active', lastActive: 'Yesterday, 8:15 PM', password: 'manager123' },
  { id: 'U-05', name: 'Sana Riaz', email: 'sana.riaz@asianwok.pk', phone: '+92 345 118 3399', role: 'staff', status: 'Invited', lastActive: '—', password: 'staff123' },
  { id: 'U-06', name: 'Bilal Khan', email: 'bilal.khan@asianwok.pk', phone: '+92 312 664 2200', role: 'staff', status: 'Suspended', lastActive: '12 May 2025', password: 'staff123' },
]
