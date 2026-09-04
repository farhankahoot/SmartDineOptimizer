import 'dotenv/config'
import crypto from 'node:crypto'

const isProd = process.env.NODE_ENV === 'production'

/** Collected so a misconfigured deployment reports every problem at once. */
const fatal: string[] = []
const warnings: string[] = []

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (value === undefined) {
    fatal.push(`${name} is not set.`)
    return ''
  }
  return value
}

/* ------------------------------------------------------------------ secret */

const DEV_SECRET_MARKERS = ['change-me', 'dev-secret', 'secret', 'password', 'changeme']

function resolveJwtSecret(): string {
  const provided = process.env.JWT_SECRET?.trim()

  if (!provided) {
    if (isProd) {
      fatal.push(
        'JWT_SECRET is not set. Generate one with `npm run gen:secret` and set it in the environment.',
      )
      return ''
    }
    // Development only: a per-boot random secret is safer than a shared
    // default, at the cost of invalidating sessions on restart.
    warnings.push('JWT_SECRET is not set — using a random secret for this run only.')
    return crypto.randomBytes(48).toString('base64url')
  }

  if (isProd) {
    if (provided.length < 32) {
      fatal.push(`JWT_SECRET is only ${provided.length} characters. Use at least 32.`)
    }
    // A secret that ships in the repo is not a secret.
    if (DEV_SECRET_MARKERS.some((m) => provided.toLowerCase().includes(m))) {
      fatal.push('JWT_SECRET looks like a placeholder. Generate a real one before deploying.')
    }
  } else if (provided.length < 32) {
    warnings.push('JWT_SECRET is short. Use at least 32 characters before deploying.')
  }

  return provided
}

/* ------------------------------------------------------------------ origins */

function resolveOrigins(): string[] {
  const raw = process.env.CLIENT_ORIGIN ?? 'http://localhost:5199'
  const origins = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  if (origins.includes('*')) {
    // A wildcard origin with credentials enabled would let any site drive the
    // API using a signed-in user's cookie.
    fatal.push('CLIENT_ORIGIN cannot be "*" — the API sends credentials.')
  }

  if (isProd) {
    for (const origin of origins) {
      if (origin.startsWith('http://') && !origin.includes('localhost')) {
        fatal.push(`CLIENT_ORIGIN "${origin}" is plain HTTP. Use HTTPS in production.`)
      }
    }
  }

  return origins
}

/* -------------------------------------------------------------------- build */

const databaseUrl = required('DATABASE_URL', 'file:./dev.db')

if (isProd && databaseUrl.startsWith('file:')) {
  warnings.push(
    'DATABASE_URL points at a SQLite file. Move to MySQL or Postgres for a real deployment.',
  )
}

export const env = {
  isProd,
  port: Number(process.env.API_PORT ?? process.env.PORT ?? 4000),
  jwtSecret: resolveJwtSecret(),
  origins: resolveOrigins(),
  databaseUrl,
  /** Redirects HTTP to HTTPS behind a proxy. Off unless explicitly enabled. */
  forceHttps: process.env.FORCE_HTTPS === 'true',
  /**
   * Shows the demo account panel on the sign-in screen. Off by default, and
   * refused outright in production, so real credentials are never listed.
   */
  showDemoAccounts: !isProd && process.env.SHOW_DEMO_ACCOUNTS !== 'false',
  /** Background jobs (reminders, expired holds). Disable on a second instance. */
  runScheduler: process.env.RUN_SCHEDULER !== 'false',
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.MAIL_FROM ?? 'Asian Wok <reservations@asianwok.pk>',
  },
  security: {
    /** Failed sign-ins before an account is temporarily locked. */
    maxLoginAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS ?? 5),
    lockoutMinutes: Number(process.env.LOCKOUT_MINUTES ?? 15),
  },
}

/** Email only leaves the machine when SMTP is actually configured. */
export const mailEnabled = Boolean(env.smtp.host && env.smtp.user)

if (isProd && !mailEnabled) {
  warnings.push('SMTP is not configured — confirmation and reset emails will not be delivered.')
}

/**
 * Called from the entry point so the process fails loudly on a bad production
 * configuration rather than starting up insecurely.
 */
export function reportEnvironment(): void {
  for (const w of warnings) console.warn(`[config] ${w}`)

  if (fatal.length > 0) {
    console.error('\n[config] Refusing to start:')
    for (const f of fatal) console.error(`  - ${f}`)
    console.error('')
    process.exit(1)
  }
}
