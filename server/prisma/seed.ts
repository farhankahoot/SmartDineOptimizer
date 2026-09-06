/**
 * Seeds the database from the fixtures the front end already ships.
 *
 * The `src/data/*.ts` modules are imported directly rather than copied, so the
 * seeded database and the screens agree by construction. Once the client is
 * wired to the API those fixtures become seed-only data.
 */
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

import { systemUsers } from '../../src/data/users.js'
import { reservations as fixtureReservations } from '../../src/data/reservations.js'
import { timeSlotRows } from '../../src/data/timeSlots.js'
import { deals as fixtureDeals } from '../../src/data/deals.js'
import { specialRequests } from '../../src/data/requests.js'
import { staffMembers } from '../../src/data/staff.js'
import { notifications, messageTemplates } from '../../src/data/communication.js'
import { restaurants } from '../../src/data/restaurants.js'
import { featureFlags, auditSeed, notificationSeed } from '../../src/data/platform.js'
import {
  revenueForecast,
  dailySalesForecast,
  footfallByTimeSlot,
  expectedGuestsByDay,
  predictedFoodDemand,
  staffByShift,
  staffCards,
  predictionStats,
  busiestSlot,
  mlRecommendations,
  topDemanded,
  lowDemanded,
} from '../../src/data/prediction.js'
import { reportData } from '../../src/data/reports.js'
import { settingDefaults } from '../src/lib/settings.js'

const prisma = new PrismaClient()

/* --------------------------------------------------------------- helpers */

/** "₨1,499" → 149900 paisa. Money is stored as an integer, never a float. */
function toMinor(price: string): number {
  const digits = price.replace(/[^\d.]/g, '')
  return Math.round(Number(digits || 0) * 100)
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** "May 22, 2025" → "2025-05-22", so dates sort and group correctly. */
function toIso(display: string): string {
  const m = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/.exec(display.trim())
  if (!m) return display
  const month = MONTHS.findIndex((name) => name.toLowerCase() === m[1].toLowerCase())
  if (month < 0) return display
  return `${m[3]}-${String(month + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}`
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Live bookings hold their table; cleared ones release it (Module 3 FE-5). */
const LIVE = new Set(['Pending', 'Confirmed', 'Updated'])
const holdFor = (status: string) => (LIVE.has(status) ? 'held' : null)

/** Parses "May 20, 2025 · 10:12 AM" into a Date, falling back to now. */
function parseTrailDate(value: string): Date {
  const [datePart, timePart] = value.split('·').map((s) => s.trim())
  const iso = toIso(datePart)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return new Date()
  const t = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(timePart ?? '')
  let hours = 12
  let minutes = 0
  if (t) {
    hours = Number(t[1]) % 12
    minutes = Number(t[2])
    if (t[3].toUpperCase() === 'PM') hours += 12
  }
  return new Date(`${iso}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`)
}

/* ----------------------------------------------------------------- tables */

/**
 * The 28 tables the console reports, across the four sections.
 *
 * Every table is placed inside the 0–100 floor-plan canvas and grouped into a
 * band per section, because both the admin plan and the guest booking plan now
 * render these rows. The Table Management mockup drew only eight tables while
 * its own KPI row read "28"; the database resolves that by holding all 28, so
 * a guest can only ever pick a table that actually exists.
 */
function buildTables() {
  type Spec = [string, number, string, string]
  const bands: { section: string; y: number; tables: Spec[] }[] = [
    {
      section: 'Window Side',
      y: 5,
      tables: [
        // code, seats, type, status
        ['A01', 2, 'Couple', 'Available'],
        ['A02', 4, 'Family', 'Available'],
        ['A05', 2, 'Couple', 'Reserved'],
        ['A07', 4, 'Family', 'Reserved'],
        ['A09', 4, 'Family', 'Reserved'],
        ['A12', 4, 'Family', 'Reserved'],
        ['A14', 2, 'Couple', 'Available'],
      ],
    },
    {
      section: 'Main Hall',
      y: 24,
      tables: [
        ['A03', 6, 'Group', 'Occupied'],
        ['B01', 8, 'Group', 'Reserved'],
        ['B02', 4, 'Family', 'Available'],
        ['B03', 6, 'Group', 'Reserved'],
        ['B05', 2, 'Couple', 'Available'],
        ['B07', 2, 'Couple', 'Reserved'],
      ],
    },
    {
      section: 'Main Hall',
      y: 43,
      tables: [
        ['B09', 4, 'Family', 'Reserved'],
        ['B11', 2, 'Couple', 'Available'],
        ['B12', 2, 'Couple', 'Reserved'],
        ['B14', 2, 'Couple', 'Available'],
        ['B15', 6, 'Group', 'Blocked'],
      ],
    },
    {
      section: 'Outdoor Terrace',
      y: 62,
      tables: [
        ['C01', 4, 'Family', 'Blocked'],
        ['C02', 2, 'Couple', 'Available'],
        ['C03', 4, 'Family', 'Reserved'],
        ['C05', 6, 'Group', 'Reserved'],
        ['C07', 6, 'Group', 'Available'],
        ['C08', 4, 'Family', 'Available'],
        ['C10', 4, 'Family', 'Blocked'],
      ],
    },
    {
      section: 'Private Room',
      y: 81,
      tables: [
        ['D01', 10, 'Private', 'Reserved'],
        ['D02', 8, 'Private', 'Reserved'],
        ['D03', 8, 'Private', 'Reserved'],
      ],
    },
  ]

  return bands.flatMap(({ section, y, tables }) => {
    // Each band spreads its tables evenly across the canvas width.
    const count = tables.length
    const gutter = 3
    const cell = (100 - gutter * 2) / count

    return tables.map(([code, seats, type, status], i) => {
      const width = Math.min(cell - 2, seats >= 8 ? 22 : seats >= 6 ? 15 : 12)
      return {
        code,
        seats,
        type,
        section,
        shape: seats <= 2 ? 'round' : seats >= 6 ? 'rect' : 'square',
        status,
        // Centred within the cell so the row reads as an even run of tables.
        x: Number((gutter + i * cell + (cell - width) / 2).toFixed(2)),
        y,
        w: Number(width.toFixed(2)),
        h: 13,
      }
    })
  })
}

/* ----------------------------------------------------------- daily metrics */

/**
 * Modules 6 and 7 want reports computed from stored rows, not from constants,
 * so the API can aggregate daily rows into weekly and monthly views. The seven
 * days the Reports screen shows are seeded verbatim; the rest of the year to
 * date is generated with a stable weekday shape so the trends are coherent.
 */
function buildDailyMetrics() {
  const known = new Map<string, (typeof reportData.Daily)[number]>()
  for (const row of reportData.Daily) {
    // "Mon, 19 May 2025" → "May 19, 2025"
    const m = /^[A-Za-z]{3},\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(row.period)
    if (m) known.set(toIso(`${m[2]} ${m[1]}, ${m[3]}`), row)
  }

  // Weekday multipliers: quiet Monday through a full Saturday.
  const byWeekday = [1.02, 0.78, 0.72, 0.86, 0.94, 1.14, 1.28] // Sun … Sat
  const rows: {
    date: string
    reservations: number
    guests: number
    confirmed: number
    cancelled: number
    revenueMinor: number
    forecastRevenueMinor: number
    wastagePct: number
    staffRequired: number
  }[] = []

  const start = '2025-01-01'
  const end = '2025-05-25'
  for (let iso = start; iso <= end; iso = addDays(iso, 1)) {
    const hit = known.get(iso)
    if (hit) {
      rows.push({
        date: iso,
        reservations: hit.reservations,
        guests: hit.guests,
        confirmed: hit.confirmed,
        cancelled: hit.cancelled,
        revenueMinor: hit.revenue * 100,
        forecastRevenueMinor: hit.forecastRevenue * 100,
        wastagePct: hit.wastagePct,
        staffRequired: hit.staffRequired,
      })
      continue
    }

    const day = new Date(`${iso}T00:00:00Z`)
    const dow = day.getUTCDay()
    const dayIndex = Math.round(
      (day.getTime() - new Date(`${start}T00:00:00Z`).getTime()) / 86_400_000,
    )
    // A slow month-on-month climb plus a deterministic wobble, so the series
    // looks like trading data instead of a straight line.
    const growth = 1 + dayIndex * 0.0016
    const wobble = 1 + 0.06 * Math.sin(dayIndex * 1.7)
    const reservationsCount = Math.round(34 * byWeekday[dow] * growth * wobble)
    const guests = Math.round(reservationsCount * 4.1)
    const cancelled = Math.max(1, Math.round(reservationsCount * 0.08))
    const confirmed = reservationsCount - cancelled - Math.round(reservationsCount * 0.05)
    const revenue = Math.round(guests * 1180 * (1 + 0.04 * Math.cos(dayIndex * 0.9)))

    rows.push({
      date: iso,
      reservations: reservationsCount,
      guests,
      confirmed,
      cancelled,
      revenueMinor: revenue * 100,
      forecastRevenueMinor: Math.round(revenue * 0.975) * 100,
      wastagePct: Number((4.2 + 1.6 * Math.abs(Math.sin(dayIndex * 0.6))).toFixed(1)),
      staffRequired: Math.max(12, Math.round(guests / 12)),
    })
  }

  return rows
}

/* ------------------------------------------------------------------- main */

async function main() {
  /**
   * The seed creates demo accounts with known passwords and wipes every table
   * first. Running it against a live database would both destroy real data and
   * hand out working credentials, so it refuses unless explicitly forced.
   */
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    console.error('Refusing to seed with NODE_ENV=production.')
    console.error('This deletes every row and creates demo accounts with known passwords.')
    console.error('Set ALLOW_PRODUCTION_SEED=true only if that is genuinely what you want.')
    process.exit(1)
  }

  console.log('Seeding SmartDine Optimizer…')

  // Wipe in dependency order so a re-seed is always clean.
  await prisma.reservationEvent.deleteMany()
  await prisma.specialRequest.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.notificationLog.deleteMany()
  await prisma.messageTemplate.deleteMany()
  await prisma.predictionOutput.deleteMany()
  await prisma.dailyMetric.deleteMany()
  await prisma.auditEntry.deleteMany()
  await prisma.adminNotification.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
  await prisma.restaurantTable.deleteMany()
  await prisma.timeSlot.deleteMany()
  await prisma.deal.deleteMany()
  await prisma.staffMember.deleteMany()
  await prisma.showcaseRestaurant.deleteMany()
  await prisma.featureFlag.deleteMany()
  await prisma.setting.deleteMany()

  /* ---- Module 8: users. Demo passwords are hashed, never stored as text. */
  const userIdByEmail = new Map<string, string>()
  for (const u of systemUsers) {
    const created = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        phone: u.phone,
        passwordHash: await bcrypt.hash(u.password, 10),
        role: u.role,
        status: u.status,
        lastActiveAt: u.lastActive === '—' ? null : new Date(),
      },
    })
    userIdByEmail.set(u.email, created.id)
  }
  console.log(`  users                ${systemUsers.length}`)

  /* ---- Module 3: tables and time slots. */
  const tables = buildTables()
  await prisma.restaurantTable.createMany({ data: tables })
  console.log(`  tables               ${tables.length}`)

  const slots = timeSlotRows.map((s) => ({
    label: s.slot,
    startTime: s.start,
    endTime: s.end,
    maxReservations: s.maxReservations,
    mealPeriod:
      s.start.includes('AM') && s.end.includes('PM')
        ? 'Special Occasion'
        : s.slot.startsWith('12:00 PM') || s.slot.startsWith('2:00 PM')
          ? 'Lunch'
          : s.slot.startsWith('10:00 PM')
            ? 'Late Night'
            : 'Dinner',
    status: s.status,
    dayOfWeek: 'All',
  }))
  await prisma.timeSlot.createMany({ data: slots })
  console.log(`  time slots           ${slots.length}`)

  /* ---- Modules 1 & 2: reservations with their full status trail. */
  const validTableCodes = new Set(tables.map((t) => t.code))
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const seen = new Set<string>()
  let reservationCount = 0
  let eventCount = 0

  for (const [index, r] of fixtureReservations.entries()) {
    const tableCode = validTableCodes.has(r.table) ? r.table : 'A01'

    /*
     * The fixture's dates are from May 2025, which made every seeded booking
     * historical: the console opened with an empty worklist and the scheduler
     * closed the lot out within minutes. Anchoring them to the day the seed
     * runs gives a demo with real pending work on real upcoming dates.
     *
     * The 20-row fixture is cycled out to 58, so repeats are pushed a week on
     * at a time — otherwise they would collide on the double-booking key.
     */
    const dayOffset = (index % 20) % 7
    const shift = Math.floor(index / 20) * 7
    const date = addDays(today, dayOffset + shift)

    const key = `${tableCode}|${date}|${r.timeSlot}`
    if (LIVE.has(r.status) && seen.has(key)) continue
    if (LIVE.has(r.status)) seen.add(key)

    // Requests arrive a couple of days before the booking, not all at once.
    const requestedAt = new Date(
      new Date(`${date}T12:00:00`).getTime() - (2 + (index % 3)) * 86_400_000,
    )

    const created = await prisma.reservation.create({
      data: {
        createdAt: requestedAt,
        reference: r.reference,
        customerName: r.customerName,
        phone: r.phone,
        email: r.email,
        date,
        timeSlot: r.timeSlot,
        guests: r.guests,
        occasion: r.occasion,
        seating: r.seating,
        tableCode,
        specialRequest: r.specialRequest,
        source: r.source,
        status: r.status,
        activeHold: holdFor(r.status),
        events: {
          create: r.history.map((h) => ({
            status: h.status,
            note: h.note ?? '',
            actorName: h.by,
            at: parseTrailDate(h.at),
          })),
        },
      },
    })
    reservationCount += 1
    eventCount += r.history.length
    void created
  }
  console.log(`  reservations         ${reservationCount} (+${eventCount} status events)`)

  /* ---- Module 4: deals, special requests and staff. */
  await prisma.deal.createMany({
    data: fixtureDeals.map((d) => ({
      name: d.name,
      category: d.category,
      occasion: d.occasion,
      priceMinor: toMinor(d.price),
      items: d.items,
      active: d.active,
    })),
  })
  console.log(`  deals                ${fixtureDeals.length}`)

  await prisma.specialRequest.createMany({
    data: specialRequests.map((s) => ({
      reference: s.reservationId,
      customerName: s.customerName,
      date: s.date,
      timeSlot: s.timeSlot,
      tableCode: s.table,
      occasion: s.occasion,
      request: s.request,
      status: s.status,
    })),
  })
  console.log(`  special requests     ${specialRequests.length}`)

  await prisma.staffMember.createMany({
    data: staffMembers.map((s) => ({
      code: s.id,
      name: s.name,
      role: s.role,
      phone: s.phone,
      shift: s.shift,
      availability: s.availability,
      joinedOn: s.joined,
    })),
  })
  console.log(`  staff                ${staffMembers.length}`)

  /* ---- Module 8: templates and the delivery log. */
  await prisma.messageTemplate.createMany({
    data: messageTemplates.map((t) => ({
      key: t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: t.title,
      body: t.body,
      channel: t.channel,
      active: t.active,
    })),
  })
  console.log(`  message templates    ${messageTemplates.length}`)

  await prisma.notificationLog.createMany({
    data: notifications.map((n) => ({
      customerName: n.customerName,
      phone: n.phone,
      email: n.email,
      channel: n.type === 'Reminder' ? 'SMS' : 'Email',
      type: n.type,
      body: `${n.type} for ${n.date} at ${n.timeSlot} · ${n.table}`,
      delivery: n.delivery,
      sentAt: n.delivery === 'Sent' ? new Date() : null,
    })),
  })
  console.log(`  notification log     ${notifications.length}`)

  /* ---- Modules 5 & 6: stored predictions and the daily series. */
  const scopeDate = '2025-05-25'
  const predictions = [
    { kind: 'revenue', payload: { hourly: revenueForecast, stats: predictionStats.find((s) => s.key === 'revenue') } },
    { kind: 'sales-forecast', payload: { daily: dailySalesForecast } },
    { kind: 'footfall', payload: { hourly: footfallByTimeSlot, byDay: expectedGuestsByDay, busiestSlot } },
    { kind: 'peak-hour', payload: { busiestSlot, recommendations: mlRecommendations } },
    { kind: 'food-demand', payload: { demand: predictedFoodDemand, top: topDemanded, low: lowDemanded } },
    { kind: 'staffing', payload: { byShift: staffByShift, cards: staffCards } },
  ]
  await prisma.predictionOutput.createMany({
    data: predictions.map((p) => ({
      kind: p.kind,
      scopeDate,
      payload: JSON.stringify(p.payload),
      model: 'seed',
      confidence: 0.78,
    })),
  })
  console.log(`  prediction outputs   ${predictions.length}`)

  const metrics = buildDailyMetrics()
  await prisma.dailyMetric.createMany({ data: metrics })
  console.log(`  daily metrics        ${metrics.length}`)

  /* ---- Platform: showcase, flags, settings, audit, notifications. */
  await prisma.showcaseRestaurant.createMany({
    data: restaurants.map((r) => ({
      name: r.name,
      city: r.city,
      province: r.province,
      cuisine: r.cuisine,
      description: r.description,
      coverFrom: r.cover[0],
      coverTo: r.cover[1],
      website: r.website ?? null,
      featured: r.featured,
      status: r.status,
      sortOrder: r.order,
    })),
  })
  console.log(`  showcase             ${restaurants.length}`)

  await prisma.featureFlag.createMany({
    data: featureFlags.map((f) => ({
      key: f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: f.name,
      description: f.description,
      area: f.area,
      enabled: f.enabled,
      endpoint: f.endpoint,
    })),
  })
  console.log(`  feature flags        ${featureFlags.length}`)

  for (const [key, value] of Object.entries(settingDefaults)) {
    await prisma.setting.create({ data: { key, value: JSON.stringify(value) } })
  }
  console.log(`  settings             ${Object.keys(settingDefaults).length}`)

  const actorByName = new Map(systemUsers.map((u) => [u.name, userIdByEmail.get(u.email) ?? null]))
  await prisma.auditEntry.createMany({
    data: auditSeed.map((a) => ({
      actorId: actorByName.get(a.actor) ?? null,
      actorName: a.actor,
      action: a.action,
      target: a.target,
      category: a.category,
      result: a.result,
      at: parseTrailDate(a.at),
    })),
  })
  console.log(`  audit entries        ${auditSeed.length}`)

  await prisma.adminNotification.createMany({
    data: notificationSeed.map((n) => ({
      tone: n.tone,
      title: n.title,
      detail: n.detail,
      link: n.to ?? null,
      read: n.read,
    })),
  })
  console.log(`  admin notifications  ${notificationSeed.length}`)

  console.log('\nDemo sign-ins (development only):')
  for (const u of systemUsers.slice(0, 4)) {
    console.log(`  ${u.role.padEnd(11)} ${u.email.padEnd(24)} ${u.password}`)
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })
