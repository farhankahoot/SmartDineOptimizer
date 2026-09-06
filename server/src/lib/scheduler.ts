/**
 * Background jobs.
 *
 * Three settings on the Communication and Settings screens describe things that
 * have to happen *without* anyone clicking a button:
 *
 *   - reminderHoursBefore  — Module 8 FE-5/FE-7, remind guests before service
 *   - holdMinutes          — Module 3 FE-5, release a table an unapproved
 *                            booking is sitting on
 *   - autoReleaseNoShow    — close out bookings whose slot has passed
 *
 * A single timer drives all three. It is intentionally simple rather than a
 * cron library: the work is idempotent, so a missed or repeated tick is
 * harmless, and each job re-reads its settings on every pass so a change in the
 * console takes effect without a restart.
 *
 * `RUN_SCHEDULER=false` disables it, which is what a second API instance behind
 * a load balancer should set so the jobs only run once.
 */
import { prisma } from '../db.js'
import { audit } from './audit.js'
import { sendReservationMessage } from './mailer.js'
import { getSetting } from './settings.js'

/** How often the timer fires. Each job decides whether it has work to do. */
const TICK_MS = 60_000

let timer: NodeJS.Timeout | null = null
let running = false

export function startScheduler(): void {
  if (timer) return
  console.log(`Scheduler started (every ${TICK_MS / 1000}s).`)
  // A first pass shortly after boot, so a restart does not skip an hour.
  timer = setInterval(() => void tick(), TICK_MS)
  timer.unref()
  setTimeout(() => void tick(), 5_000).unref()
}

export function stopScheduler(): void {
  if (!timer) return
  clearInterval(timer)
  timer = null
}

/** Overlapping runs are skipped rather than queued. */
async function tick(): Promise<void> {
  if (running) return
  running = true
  try {
    await sendDueReminders()
    await releaseExpiredHolds()
    await closeOutNoShows()
  } catch (err) {
    console.error('[scheduler] tick failed', err)
  } finally {
    running = false
  }
}

/* ------------------------------------------------------------- reminders */

/**
 * Module 8 FE-5 — reminds guests the configured number of hours before their
 * slot. A reminder is sent once per booking: the notification log is the
 * record, so a restart cannot double-send.
 */
async function sendDueReminders(): Promise<void> {
  const settings = await getSetting('notification.settings')
  if (!settings.reminderEnabled) return

  const now = new Date()
  const windowEnd = new Date(now.getTime() + settings.reminderHoursBefore * 3_600_000)

  // Only today's and tomorrow's bookings can possibly be due, which keeps this
  // to a small scan however large the table grows.
  const candidates = await prisma.reservation.findMany({
    where: {
      status: 'Confirmed',
      activeHold: 'held',
      date: { in: [isoDate(now), isoDate(new Date(now.getTime() + 86_400_000))] },
    },
  })

  for (const r of candidates) {
    const startsAt = slotStart(r.date, r.timeSlot)
    if (!startsAt) continue
    // Due once the booking is inside the reminder window but still ahead.
    if (startsAt <= now || startsAt > windowEnd) continue

    const alreadySent = await prisma.notificationLog.count({
      where: { reference: r.reference, type: 'Reminder' },
    })
    if (alreadySent > 0) continue

    await sendReservationMessage(r, 'Reminder')
    await audit({
      actorName: 'Scheduler',
      action: 'Sent reservation reminder',
      target: r.reference,
      category: 'Message',
    })
  }
}

/* ----------------------------------------------------------- table holds */

/**
 * Module 3 FE-5 — the booking page promises the table is held for a set number
 * of minutes. A pending request older than that releases its table so the slot
 * is offered to someone else, and the guest is told.
 */
async function releaseExpiredHolds(): Promise<void> {
  const rules = await getSetting('reservation.rules')
  if (rules.holdMinutes <= 0) return

  // Only requests still awaiting approval expire; a confirmed booking keeps
  // its table regardless of age.
  const cutoff = new Date(Date.now() - rules.holdMinutes * 60_000)
  const expired = await prisma.reservation.findMany({
    where: {
      status: 'Pending',
      activeHold: 'held',
      createdAt: { lt: cutoff },
      // Only bookings still ahead of us. A pending request for a date that has
      // already passed is moot: releasing its table changes nothing, and
      // emailing the guest a cancellation for last month's dinner is worse
      // than doing nothing. Those are closed quietly by the no-show job.
      date: { gte: isoDate(new Date()) },
    },
    take: 50,
  })

  for (const r of expired) {
    const updated = await prisma.reservation.update({
      where: { id: r.id },
      data: {
        status: 'Cancelled',
        activeHold: null,
        events: {
          create: {
            status: 'Cancelled',
            note: `Table hold expired after ${rules.holdMinutes} minutes without approval.`,
            actorName: 'System',
          },
        },
      },
    })

    await sendReservationMessage(updated, 'Cancellation')
    await audit({
      actorName: 'Scheduler',
      action: 'Released expired table hold',
      target: r.reference,
      category: 'Reservation',
    })
  }
}

/* -------------------------------------------------------------- no-shows */

/**
 * Marks confirmed bookings complete once their slot has finished, so the table
 * is released and the reservation leaves the live worklist. Guests are not
 * messaged: nothing went wrong from their side.
 */
async function closeOutNoShows(): Promise<void> {
  const rules = await getSetting('reservation.rules')
  if (!rules.autoReleaseNoShow) return

  const now = new Date()
  const graceMs = (rules.slotLengthMinutes + 60) * 60_000

  const stale = await prisma.reservation.findMany({
    where: {
      status: { in: ['Confirmed', 'Updated'] },
      activeHold: 'held',
      date: { lte: isoDate(now) },
    },
    take: 100,
  })

  for (const r of stale) {
    const startsAt = slotStart(r.date, r.timeSlot)
    if (!startsAt || now.getTime() - startsAt.getTime() < graceMs) continue

    await prisma.reservation.update({
      where: { id: r.id },
      data: {
        status: 'Completed',
        activeHold: null,
        events: {
          create: {
            status: 'Completed',
            note: 'Closed automatically once the time slot had passed.',
            actorName: 'System',
          },
        },
      },
    })

    await audit({
      actorName: 'Scheduler',
      action: 'Closed out a finished booking',
      target: r.reference,
      category: 'Reservation',
    })
  }
}

/* --------------------------------------------------------------- helpers */

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Combines a stored date with the start of its slot label. Handles both a
 * single time ("8:00 PM") and a range ("6:00 PM – 8:00 PM"), and returns null
 * for anything it cannot parse rather than guessing.
 */
function slotStart(date: string, timeSlot: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null

  const m = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i.exec(timeSlot)
  if (!m) return null

  let hour = Number(m[1]) % 12
  if (m[3].toUpperCase() === 'PM') hour += 12

  const [y, mo, d] = date.split('-').map(Number)
  const at = new Date(y, mo - 1, d, hour, Number(m[2] ?? 0), 0, 0)
  return Number.isNaN(at.getTime()) ? null : at
}
