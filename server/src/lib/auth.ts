/**
 * Module 8 FE-1 — authentication.
 *
 * A signed JWT carries the user id plus a `jti` that matches a `Session` row.
 * Verifying a token therefore needs a database lookup, which is what makes
 * "revoke this session" and "sign out everywhere" actually work.
 */
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { Request } from 'express'
import { prisma } from '../db.js'
import { env } from '../env.js'
import type { Role } from './permissions.js'

export interface TokenPayload {
  sub: string
  jti: string
  role: Role
}

const TOKEN_TTL_DAYS = 7

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10)
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash)

/** Reset tokens are stored hashed — a leaked table cannot be replayed. */
export const hashToken = (raw: string) => crypto.createHash('sha256').update(raw).digest('hex')
export const randomToken = () => crypto.randomBytes(32).toString('hex')

/** Creates a session row and returns the bearer token bound to it. */
export async function issueSession(
  user: { id: string; role: string },
  req: Request,
): Promise<{ token: string; expiresAt: Date }> {
  const jti = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 86_400_000)

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenId: jti,
      device: describeDevice(req.get('user-agent') ?? ''),
      location: '—',
      expiresAt,
    },
  })

  const payload: TokenPayload = { sub: user.id, jti, role: user.role as Role }
  const token = jwt.sign(payload, env.jwtSecret, {
    expiresIn: `${TOKEN_TTL_DAYS}d`,
  })

  return { token, expiresAt }
}

export async function revokeSession(tokenId: string): Promise<void> {
  await prisma.session
    .update({ where: { tokenId }, data: { revokedAt: new Date() } })
    .catch(() => undefined)
}

export async function revokeAllSessions(userId: string, exceptTokenId?: string): Promise<number> {
  const result = await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptTokenId ? { NOT: { tokenId: exceptTokenId } } : {}),
    },
    data: { revokedAt: new Date() },
  })
  return result.count
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as TokenPayload
  } catch {
    return null
  }
}

/** Reads the bearer token from the Authorization header or the auth cookie. */
export function readToken(req: Request): string | null {
  const header = req.get('authorization')
  if (header?.startsWith('Bearer ')) return header.slice(7).trim()
  const cookie = (req as Request & { cookies?: Record<string, string> }).cookies?.sd_token
  return cookie ?? null
}

/** A readable device label for the sessions list — no fingerprinting. */
function describeDevice(ua: string): string {
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome\//.test(ua)
      ? 'Chrome'
      : /Safari\//.test(ua)
        ? 'Safari'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : 'Browser'
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Android/.test(ua)
      ? 'Android'
      : /iPhone|iPad/.test(ua)
        ? 'iOS'
        : /Mac OS X/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'Unknown'
  return `${browser} · ${os}`
}

/**
 * Password strength is enforced against the live system settings so the rule
 * the admin sets on the Security screen is the rule the server applies.
 */
export function checkPasswordStrength(
  password: string,
  policy: { minPasswordLength: number; requireStrongPassword: boolean },
): string | null {
  if (password.length < policy.minPasswordLength) {
    return `Password must be at least ${policy.minPasswordLength} characters.`
  }
  if (policy.requireStrongPassword) {
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return 'Password must contain at least one letter and one number.'
    }
  }
  return null
}
