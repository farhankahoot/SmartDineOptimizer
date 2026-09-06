import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { env, mailEnabled, reportEnvironment } from './env.js'
import { prisma } from './db.js'
import { errorHandler, notFound } from './lib/http.js'
import { blockWhenReadOnly, loadUser, requireAuth } from './middleware/auth.js'
import {
  authLimiter,
  authSourceLimiter,
  bookingLimiter,
  generalLimiter,
  publicWriteLimiter,
  requireHttps,
  securityHeaders,
} from './middleware/security.js'
import { startScheduler, stopScheduler } from './lib/scheduler.js'

import { authRouter } from './routes/auth.js'
import { publicRouter } from './routes/public.js'
import { reservationsRouter } from './routes/reservations.js'
import { tablesRouter } from './routes/tables.js'
import { slotsRouter } from './routes/slots.js'
import { dealsRouter, requestsRouter } from './routes/deals.js'
import { staffRouter } from './routes/staff.js'
import { dashboardRouter } from './routes/dashboard.js'
import { reportsRouter } from './routes/reports.js'
import { predictionsRouter } from './routes/predictions.js'
import { notificationsRouter } from './routes/notifications.js'
import { usersRouter } from './routes/users.js'
import { settingsRouter } from './routes/settings.js'
import { platformRouter } from './routes/platform.js'

// Refuses to start on an insecure production configuration.
reportEnvironment()

const app = express()

// Required for correct client IPs (rate limiting) and req.secure behind a
// proxy. `1` trusts exactly one hop — the load balancer — rather than
// believing any X-Forwarded-For a client sends.
app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(securityHeaders)
app.use(requireHttps)

/**
 * Allowed origins.
 *
 * Production is an exact allow-list — env.ts already refuses a wildcard or a
 * plain-HTTP origin there. Development also accepts any localhost port,
 * because Vite silently increments to 5174, 5175 … when its port is busy, and
 * an API that only trusted one number would reject the app's own requests and
 * look like a broken build rather than a port clash.
 */
const LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

app.use(
  cors({
    origin(origin, callback) {
      // Same-origin requests, curl and server-to-server calls send no Origin.
      if (!origin) return callback(null, true)
      if (env.origins.includes(origin)) return callback(null, true)
      if (!env.isProd && LOCALHOST.test(origin)) return callback(null, true)
      callback(null, false)
    },
    credentials: true,
    // The browser may not read anything it was not explicitly offered.
    exposedHeaders: ['Content-Disposition'],
  }),
)

// Cover images arrive as base64 data URLs, so the JSON limit has to clear the
// 2 MB image ceiling with room for the rest of the payload.
app.use(express.json({ limit: '4mb' }))
app.use(cookieParser())
app.use(generalLimiter)
app.use(loadUser)

/** Liveness probe — deliberately unauthenticated and free of any detail. */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptimeSeconds: Math.floor(process.uptime()) })
})

/**
 * The few runtime flags the client needs before anyone signs in. Nothing here
 * is sensitive: it says whether a feature is on, never how it is configured.
 */
app.get('/api/client-config', (_req, res) => {
  res.json({ showDemoAccounts: env.showDemoAccounts, mailConfigured: mailEnabled })
})

// Sign-in and password reset are the highest-value targets, so they carry
// their own tight limiter on top of the general one.
app.use('/api/auth/login', authSourceLimiter, authLimiter)
app.use('/api/auth/forgot-password', authSourceLimiter, authLimiter)
app.use('/api/auth/reset-password', authSourceLimiter, authLimiter)
app.use('/api/auth', authRouter)

app.use('/api/public/reservations', bookingLimiter)
app.use('/api/public/showcase/submit', publicWriteLimiter)
app.use('/api/public/feedback', publicWriteLimiter)
app.use('/api/public', publicRouter)

// Everything below needs a session, and is blocked while read-only mode is on.
const guarded = [requireAuth, blockWhenReadOnly]

app.use('/api/reservations', guarded, reservationsRouter)
app.use('/api/tables', guarded, tablesRouter)
app.use('/api/time-slots', guarded, slotsRouter)
app.use('/api/deals', guarded, dealsRouter)
app.use('/api/special-requests', guarded, requestsRouter)
app.use('/api/staff', guarded, staffRouter)
app.use('/api/dashboard', guarded, dashboardRouter)
app.use('/api/reports', guarded, reportsRouter)
app.use('/api/predictions', guarded, predictionsRouter)
app.use('/api/notifications', guarded, notificationsRouter)
app.use('/api/users', guarded, usersRouter)
app.use('/api/settings', guarded, settingsRouter)
app.use('/api/platform', guarded, platformRouter)

app.use((_req, _res, next) => next(notFound('That endpoint does not exist.')))
app.use(errorHandler)

const server = app.listen(env.port, () => {
  console.log(`SmartDine API listening on http://localhost:${env.port}`)
  console.log(`Allowing origins: ${env.origins.join(', ')}${env.isProd ? '' : ' (plus any localhost port)'}`)
  if (env.runScheduler) startScheduler()
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`
Port ${env.port} is already in use — the API is probably running elsewhere.`)
    console.error('Stop the other copy, or start this one on a different port:')
    console.error(`  API_PORT=4001 npm run dev
`)
    process.exit(1)
  }
  throw err
})

/**
 * Stops accepting connections, lets in-flight requests finish, then closes the
 * database. A hard exit after 10s covers a connection that never drains.
 */
let shuttingDown = false
async function shutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`\n${signal} received, shutting down.`)

  const force = setTimeout(() => {
    console.error('Forced exit after 10s.')
    process.exit(1)
  }, 10_000)
  force.unref()

  stopScheduler()
  await new Promise<void>((resolve) => server.close(() => resolve()))
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

// A crash must not leave the process running in an unknown state.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
})
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err)
  void shutdown('uncaughtException')
})
