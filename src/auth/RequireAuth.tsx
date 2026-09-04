import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { ForbiddenPage } from '@/pages/public/ForbiddenPage'
import type { Permission } from '@/data/users'

/** Module 8 FE-1: unauthenticated visitors are bounced to the sign-in screen. */
export function RequireAuth() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <Outlet />
}

/**
 * Module 8 FE-3: a route the current role cannot see renders an explicit 403
 * rather than silently bouncing, so the reason is visible.
 */
export function RequirePermission({
  permission,
  /** Console routes bounce home; platform routes explain the refusal. */
  mode = 'redirect',
}: {
  permission: Permission
  mode?: 'redirect' | 'forbid'
}) {
  const { allows } = useAuth()
  if (allows(permission)) return <Outlet />
  return mode === 'forbid' ? <ForbiddenPage /> : <Navigate to="/admin" replace />
}
