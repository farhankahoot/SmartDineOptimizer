/**
 * Transport and abuse protections applied before any route runs.
 */
import type { NextFunction, Request, Response } from 'express'
import helmet from 'helmet'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { env } from '../env.js'

/**
 * Security headers.
 *
 * The API only ever returns JSON, so its own CSP can be maximally strict —
 * nothing is allowed to load or execute. Serving the built front end is a
 * separate concern handled by whatever hosts the static files.
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
    },
  },
  // Browsers only honour HSTS over HTTPS; sending it in dev would pin
  // localhost to HTTPS and make the app unreachable.
  hsts: env.isProd ? { maxAge: 31_536_000, includeSubDomains: true, preload: true } : false,
  referrerPolicy: { policy: 'no-referrer' },
  crossOriginResourcePolicy: { policy: 'same-site' },
})

/** Redirects to HTTPS when running behind a terminating proxy. */
export function requireHttps(req: Request, res: Response, next: NextFunction): void {
  if (!env.forceHttps || req.secure || req.get('x-forwarded-proto') === 'https') return next()
  res.redirect(308, `https://${req.get('host')}${req.originalUrl}`)
}

/**
 * Rate limiters.
 *
 * `ipKeyGenerator` is used rather than a raw `req.ip` so IPv6 clients are
 * grouped by subnet — otherwise a single host could rotate through addresses
 * in its /64 and bypass the limit entirely.
 */
const baseOptions = {
  standardHeaders: true as const,
  legacyHeaders: false as const,
  message: { error: 'Too many requests. Please slow down.', code: 'rate_limited' },
}

/** Broad ceiling across the whole API. */
export const generalLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60_000,
  limit: 300,
})

/**
 * Sign-in and password reset. Deliberately tight, and counted per address
 * *and* per account so one attacker cannot lock out every user by cycling
 * through emails from one IP.
 */
export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60_000,
  limit: 10,
  // Only failed attempts count, so a busy shift signing in legitimately is
  // never throttled.
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : ''
    return `${ipKeyGenerator(req.ip ?? '')}|${email}`
  },
  message: {
    error: 'Too many sign-in attempts. Wait 15 minutes and try again.',
    code: 'rate_limited',
  },
})

/**
 * A second, wider limit keyed on the address alone.
 *
 * `authLimiter` is keyed per address *and* account, which stops one account
 * being hammered — but an attacker trying a single common password across many
 * different emails would get a fresh budget for each one. This caps the total
 * failed sign-in volume from any one source.
 */
export const authSourceLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60_000,
  limit: 40,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ''),
  message: {
    error: 'Too many sign-in attempts from this connection. Try again later.',
    code: 'rate_limited',
  },
})

/** Public booking, to stop the reservation book being flooded. */
export const bookingLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60_000,
  limit: 12,
  message: {
    error: 'Too many booking requests from this connection. Please call the restaurant.',
    code: 'rate_limited',
  },
})

/** Anything unauthenticated that writes: password resets, guest feedback. */
export const publicWriteLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60_000,
  limit: 20,
})
