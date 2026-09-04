import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../db.js'
import { readToken, verifyToken } from '../lib/auth.js'
import { can, type Permission, type Role } from '../lib/permissions.js'
import { forbidden, unauthorized } from '../lib/http.js'
import { getSystem } from '../lib/settings.js'

export interface AuthUser {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  status: string
  /** The jti of the session this request is using. */
  tokenId: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

/**
 * Resolves the caller if a valid, unrevoked session exists. Never rejects —
 * routes that require a user use `requireAuth` on top of this.
 */
export async function loadUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = readToken(req)
  if (!token) return next()

  const payload = verifyToken(token)
  if (!payload) return next()

  const session = await prisma.session.findUnique({
    where: { tokenId: payload.jti },
    include: { user: true },
  })

  // A revoked, expired or deleted session is not a session.
  if (!session || session.revokedAt || session.expiresAt < new Date()) return next()
  // A suspended account loses access immediately, without waiting for expiry.
  if (session.user.status === 'Suspended') return next()

  // Idle timeout, using the window the administrator set. An unattended
  // console in a busy restaurant is a real risk, so the session is revoked
  // rather than merely ignored — the token cannot be reused.
  const system = await getSystem()
  const idleMs = system.sessionTimeoutMinutes * 60_000
  if (Date.now() - session.lastSeenAt.getTime() > idleMs) {
    await prisma.session
      .update({ where: { tokenId: payload.jti }, data: { revokedAt: new Date() } })
      .catch(() => undefined)
    return next()
  }

  req.user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    phone: session.user.phone,
    role: session.user.role as Role,
    status: session.user.status,
    tokenId: payload.jti,
  }

  // Keeps the sessions list honest without writing on every single request.
  const staleBy = Date.now() - session.lastSeenAt.getTime()
  if (staleBy > 60_000) {
    await prisma.session
      .update({ where: { tokenId: payload.jti }, data: { lastSeenAt: new Date() } })
      .catch(() => undefined)
    await prisma.user
      .update({ where: { id: session.user.id }, data: { lastActiveAt: new Date() } })
      .catch(() => undefined)
  }

  next()
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next(unauthorized())
  next()
}

/** Module 8 FE-3/FE-4 — the server, not the UI, decides what a role may do. */
export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(unauthorized())
    if (!can(req.user.role, permission)) return next(forbidden())
    next()
  }
}

export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(unauthorized())
    if (!allowed.includes(req.user.role)) return next(forbidden())
    next()
  }
}

/**
 * Read-only mode blocks every write across the console, for everyone except a
 * super admin — who needs to be able to turn it back off.
 */
export async function blockWhenReadOnly(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next()

  const system = await getSystem()
  if (!system.readOnlyMode) return next()
  if (req.user?.role === 'superadmin') return next()

  next(
    forbidden(
      'The system is in read-only mode. Changes are disabled until an administrator turns it off.',
    ),
  )
}
