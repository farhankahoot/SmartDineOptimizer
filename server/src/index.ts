import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { env } from './env.js'
import { prisma } from './db.js'
import { errorHandler, notFound } from './lib/http.js'
import { blockWhenReadOnly, loadUser, requireAuth } from './middleware/auth.js'

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

const app = express()

app.set('trust proxy', 1)
app.use(
  cors({
    origin: env.clientOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  }),
)
// Cover images arrive as base64 data URLs, so the JSON limit has to clear 2 MB.
app.use(express.json({ limit: '4mb' }))
app.use(cookieParser())
app.use(loadUser)

/** Liveness probe — deliberately unauthenticated and free of any detail. */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptimeSeconds: Math.floor(process.uptime()) })
})

app.use('/api/auth', authRouter)
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
  console.log(`Allowing requests from ${env.clientOrigin}`)
})

async function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down.`)
  server.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
