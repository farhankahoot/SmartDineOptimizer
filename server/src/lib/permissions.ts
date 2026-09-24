/**
 * Role and permission model — Module 8 FE-2 / FE-3 / FE-4.
 *
 * This mirrors `src/data/users.ts` in the client, but the server copy is the
 * one that decides. The client only hides controls; every protected route
 * re-checks here, so a crafted request cannot bypass a role.
 */

export type Role = 'superadmin' | 'admin' | 'manager' | 'staff'

export const roles: Role[] = ['superadmin', 'admin', 'manager', 'staff']

export const roleLabels: Record<Role, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrator',
  manager: 'Manager',
  staff: 'Staff',
}

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
  | 'view:platform'
  | 'manage:platform-users'
  | 'manage:roles'
  | 'manage:content'
  | 'manage:system'
  | 'manage:features'
  | 'view:health'
  | 'manage:security'
  | 'view:audit'

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

/** The restaurant administrator runs the console but not the platform tier. */
const adminPermissions: Permission[] = allPermissions.filter(
  (p) => p !== 'view:platform' && !PLATFORM_ONLY.has(p),
)

export const rolePermissions: Record<Role, Permission[] | 'all'> = {
  superadmin: 'all',
  admin: adminPermissions,
  manager: managerPermissions,
  staff: staffPermissions,
}

export function can(role: Role, permission: Permission): boolean {
  const granted = rolePermissions[role]
  return granted === 'all' || granted.includes(permission)
}

export function permissionsFor(role: Role): Permission[] {
  const granted = rolePermissions[role]
  return granted === 'all' ? [...allPermissions] : [...granted]
}

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (roles as string[]).includes(value)
}
