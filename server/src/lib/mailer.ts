/**
 * Module 8 FE-5/FE-6/FE-7 — confirmation, reminder, update and cancellation
 * messages.
 *
 * Every send is recorded in `NotificationLog` whether or not SMTP is
 * configured. With no SMTP host the message is logged with delivery "Pending"
 * and printed to the console, so the flow is fully exercised in development
 * without silently pretending mail was delivered.
 */
import nodemailer, { type Transporter } from 'nodemailer'
import { prisma } from '../db.js'
import { env, mailEnabled } from '../env.js'
import { getSetting } from './settings.js'

let transporter: Transporter | null = null

function getTransporter(): Transporter | null {
  if (!mailEnabled) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    })
  }
  return transporter
}

export type MessageType =
  | 'Confirmation'
  | 'Reminder'
  | 'Update'
  | 'Cancellation'
  | 'Special Request'
  | 'Password Reset'

const TEMPLATE_KEY: Record<string, string> = {
  Confirmation: 'reservation-confirmation',
  Reminder: 'reservation-reminder',
  Update: 'reservation-update',
  Cancellation: 'reservation-cancellation',
  'Special Request': 'special-request-confirmation',
}

export interface SendInput {
  to: string
  type: MessageType
  reference?: string
  customerName: string
  phone?: string
  /** Placeholder values substituted into the stored template. */
  vars?: Record<string, string>
  /** Overrides the template body entirely (used for password resets). */
  body?: string
  subject?: string
}

/** Substitutes `[name]`, `[date]`, `[time]`, `[table]` and friends. */
function fill(body: string, vars: Record<string, string>): string {
  return body.replace(/\[(\w+)\]/g, (match, key: string) => vars[key] ?? match)
}

export async function sendMessage(input: SendInput): Promise<{ delivery: string; body: string }> {
  let body = input.body ?? ''
  let channel = 'Email'

  if (!body) {
    const key = TEMPLATE_KEY[input.type]
    const template = key ? await prisma.messageTemplate.findUnique({ where: { key } }) : null
    if (template && !template.active) {
      // A disabled template means the restaurant chose not to send this type.
      return { delivery: 'Skipped', body: '' }
    }
    body = template ? fill(template.body, { name: input.customerName, ...input.vars }) : ''
    if (template) channel = template.channel
  }

  // Only Email has a real transport in this build; SMS and WhatsApp are logged
  // as pending because no gateway credentials exist.
  const canDeliver = channel === 'Email' && Boolean(getTransporter())
  let delivery = canDeliver ? 'Sent' : 'Pending'
  let error: string | null = null

  if (canDeliver) {
    try {
      await getTransporter()!.sendMail({
        from: env.smtp.from,
        to: input.to,
        subject: input.subject ?? `${input.type} — ${input.reference ?? 'Asian Wok'}`,
        text: body,
      })
    } catch (err) {
      delivery = 'Failed'
      error = err instanceof Error ? err.message : 'Unknown transport error'
      console.error('[mail] send failed', err)
    }
  } else {
    console.log(`[mail:not-configured] ${input.type} → ${input.to}\n${body}\n`)
  }

  await prisma.notificationLog.create({
    data: {
      reference: input.reference ?? '',
      customerName: input.customerName,
      phone: input.phone ?? '',
      email: input.to,
      channel,
      type: input.type === 'Password Reset' ? 'Update' : input.type,
      body,
      delivery,
      error,
      sentAt: delivery === 'Sent' ? new Date() : null,
    },
  })

  return { delivery, body }
}

/** Fires the automatic message for a reservation status change, if enabled. */
export async function sendReservationMessage(
  reservation: {
    reference: string
    customerName: string
    email: string
    phone: string
    date: string
    timeSlot: string
    tableCode: string
  },
  type: MessageType,
): Promise<void> {
  const settings = await getSetting('notification.settings')
  if (type === 'Confirmation' && !settings.confirmOnApproval) return
  if (type === 'Cancellation' && !settings.cancellationEnabled) return
  if (type === 'Reminder' && !settings.reminderEnabled) return

  await sendMessage({
    to: reservation.email,
    phone: reservation.phone,
    type,
    reference: reservation.reference,
    customerName: reservation.customerName,
    vars: {
      date: reservation.date,
      time: reservation.timeSlot,
      table: reservation.tableCode,
      reference: reservation.reference,
    },
  })
}
