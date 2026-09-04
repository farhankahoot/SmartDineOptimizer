import 'dotenv/config'

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (value === undefined) throw new Error(`Missing required env var: ${name}`)
  return value
}

/**
 * The API reads API_PORT first.
 *
 * `PORT` is deliberately only a fallback: when the API and the web dev server
 * are started together, the tooling injects PORT for the front end, and an API
 * that honoured it would bind to the web server's port instead of its own.
 * A single-service host that only sets PORT still works.
 */
export const env = {
  port: Number(process.env.API_PORT ?? process.env.PORT ?? 4000),
  jwtSecret: required('JWT_SECRET', 'smartdine-dev-secret'),
  clientOrigin: required('CLIENT_ORIGIN', 'http://localhost:5199'),
  isProd: process.env.NODE_ENV === 'production',
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.MAIL_FROM ?? 'Asian Wok <reservations@asianwok.pk>',
  },
}

/** Email only leaves the machine when SMTP is actually configured. */
export const mailEnabled = Boolean(env.smtp.host && env.smtp.user)
