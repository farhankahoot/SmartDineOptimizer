import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  Mail,
  MessageCircle,
  MessageSquare,
  MoreVertical,
  Pencil,
  RotateCw,
  Send,
  Settings,
  ShieldCheck,
  SquarePen,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMobileNav } from '@/components/layout/useMobileNav'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, DotStatus, type BadgeTone } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Label, Select, Textarea, Toggle } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'
import {
  type DeliveryStatus,
  type MessageTemplate,
  type NotificationRow,
  type NotificationStatus,
} from '@/data/communication'
import { api, messageOf } from '@/lib/api'
import { useApi } from '@/lib/useApi'
import { useToast } from '@/components/ui/Toast'

interface LogRow {
  id: string
  reference: string
  customerName: string
  phone: string
  email: string
  channel: string
  type: string
  body: string
  delivery: DeliveryStatus
  error: string | null
  sentAt: string | null
  createdAt: string
}

interface StatsPayload {
  sentToday: number
  confirmations: number
  reminders: number
  pending: number
  successRate: number
  /** False when no SMTP host is set, so the UI must not imply delivery. */
  transportConfigured: boolean
}

interface ActivityPayload {
  activity: { id: string; at: string; title: string; detail: string; tone: string }[]
}

interface TemplatePayload {
  templates: { id: string; key: string; title: string; body: string; channel: string; active: boolean }[]
}

interface SettingsPayload {
  settings: {
    confirmOnApproval: boolean
    reminderEnabled: boolean
    reminderHoursBefore: number
    cancellationEnabled: boolean
    allowManualResend: boolean
  }
  transportConfigured: boolean
}

const templateIconFor = (channel: string) =>
  channel === 'SMS' ? 'chat' : channel === 'WhatsApp' ? 'whatsapp' : 'mail'

const SETTING_LABELS: { key: keyof SettingsPayload['settings']; title: string; detail: string }[] = [
  { key: 'confirmOnApproval', title: 'Send confirmation after admin approval', detail: 'Automatically send confirmation once a reservation is approved.' },
  { key: 'reminderEnabled', title: 'Send reminder before the reservation', detail: 'Send an automatic reminder ahead of the booking time.' },
  { key: 'cancellationEnabled', title: 'Send cancellation message automatically', detail: 'Notify customers automatically when a reservation is cancelled.' },
  { key: 'allowManualResend', title: 'Allow manual resend', detail: 'Let admins resend failed or pending notifications by hand.' },
]

const statIcons = { send: Send, mail: Mail, bell: Bell, clock: Clock, shield: ShieldCheck }

const statusTone: Record<NotificationStatus, BadgeTone> = {
  Confirmed: 'confirmed',
  Cancelled: 'cancelled',
  Pending: 'completed',
}

const deliveryDot: Record<DeliveryStatus, string> = {
  Sent: '#1B7A3D',
  Scheduled: '#E0A32E',
  Pending: '#2563EB',
  Failed: '#DC2626',
}

const templateIcons = {
  mail: Mail,
  chat: MessageSquare,
  edit: SquarePen,
  cancel: XCircle,
  whatsapp: MessageCircle,
}

const channels = ['Email', 'SMS', 'WhatsApp'] as const

export function CommunicationPage() {
  const { toggle } = useMobileNav()
  const { push } = useToast()

  const logQuery = useApi<{ notifications: LogRow[] }>('/notifications', { perPage: 50 })
  const statsQuery = useApi<StatsPayload>('/notifications/stats')
  const activityQuery = useApi<ActivityPayload>('/notifications/activity')
  const templatesQuery = useApi<TemplatePayload>('/notifications/templates')
  const settingsQuery = useApi<SettingsPayload>('/notifications/settings')

  const live = settingsQuery.data?.settings
  const settings = SETTING_LABELS.map((row) => ({
    id: row.key,
    title: row.title,
    detail: row.detail,
    enabled: live ? Boolean(live[row.key]) : false,
  }))

  const setSettings = async (key: keyof SettingsPayload['settings'], value: boolean) => {
    try {
      await api.put('/notifications/settings', { [key]: value })
      settingsQuery.refresh()
    } catch (err) {
      push({ tone: 'error', title: 'Setting not saved', detail: messageOf(err) })
    }
  }

  // The delivery log carries the reference, not the booking's own columns, so
  // the table maps each entry onto the shape the columns expect.
  const notifications: NotificationRow[] = (logQuery.data?.notifications ?? []).map((n) => ({
    id: n.id,
    customerName: n.customerName,
    phone: n.phone || '—',
    email: n.email,
    date: new Date(n.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    timeSlot: n.channel,
    table: n.reference || '—',
    status: (n.delivery === 'Failed' ? 'Pending' : 'Confirmed') as NotificationStatus,
    type: n.type,
    delivery: n.delivery,
  }))

  const st = statsQuery.data
  const communicationStats = [
    { key: 'sent', label: 'Messages Sent Today', value: String(st?.sentToday ?? 0), delta: '', trend: 'flat' as const, icon: 'send' as const },
    { key: 'confirmations', label: 'Confirmations Sent', value: String(st?.confirmations ?? 0), delta: '', trend: 'flat' as const, icon: 'mail' as const },
    { key: 'reminders', label: 'Reminders Scheduled', value: String(st?.reminders ?? 0), delta: '', trend: 'flat' as const, icon: 'bell' as const },
    { key: 'pending', label: 'Pending Notifications', value: String(st?.pending ?? 0), delta: '', trend: 'flat' as const, icon: 'clock' as const },
    { key: 'success', label: 'Delivery Success Rate', value: `${st?.successRate ?? 0}%`, delta: '', trend: 'flat' as const, icon: 'shield' as const },
  ]

  const communicationActivity = (activityQuery.data?.activity ?? []).map((a) => ({
    id: a.id,
    time: new Date(a.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    title: a.title,
    detail: a.detail,
    tone: a.tone as 'success' | 'warn' | 'danger',
  }))

  const messageTemplates: MessageTemplate[] = (templatesQuery.data?.templates ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    body: t.body,
    channel: t.channel as MessageTemplate['channel'],
    active: t.active,
    icon: templateIconFor(t.channel) as MessageTemplate['icon'],
    color: t.channel === 'SMS' ? '#3A7BD5' : t.channel === 'WhatsApp' ? '#25A65B' : '#2E9E63',
  }))

  /** Retries a delivery through the server rather than only showing a notice. */
  const resend = async (id: string) => {
    try {
      const result = await api.post<{ delivery: string }>(`/notifications/${id}/resend`)
      push({
        tone: result.delivery === 'Sent' ? 'success' : 'info',
        title: result.delivery === 'Sent' ? 'Message sent' : `Message ${result.delivery.toLowerCase()}`,
        detail:
          result.delivery === 'Sent'
            ? 'Delivered over SMTP.'
            : 'Recorded in the log. No transport is configured, so nothing was delivered.',
      })
      logQuery.refresh()
      statsQuery.refresh()
      activityQuery.refresh()
    } catch (err) {
      push({ tone: 'error', title: 'Resend failed', detail: messageOf(err) })
    }
  }
  const [channel, setChannel] = useState<(typeof channels)[number]>('Email')
  const [message, setMessage] = useState('')
  const [reservation, setReservation] = useState('')
  const [messageType, setMessageType] = useState('')
  const [editing, setEditing] = useState<MessageTemplate | null>(null)
  const [sentNotice, setSentNotice] = useState(false)

  const columns: Column<NotificationRow>[] = [
    { key: 'name', header: 'Customer Name', className: 'font-semibold text-ink', render: (r) => r.customerName },
    { key: 'phone', header: 'Phone Number', render: (r) => r.phone },
    { key: 'email', header: 'Email', render: (r) => r.email },
    { key: 'date', header: 'Reservation Date', render: (r) => r.date },
    { key: 'slot', header: 'Time Slot', render: (r) => r.timeSlot },
    { key: 'table', header: 'Selected Table', render: (r) => r.table },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (r) => <Badge tone={statusTone[r.status]}>{r.status}</Badge>,
    },
    { key: 'type', header: 'Notification Type', render: (r) => r.type },
    {
      key: 'delivery',
      header: 'Delivery Status',
      render: (r) => <DotStatus color={deliveryDot[r.delivery]}>{r.delivery}</DotStatus>,
    },
    {
      key: 'action',
      header: 'Action',
      align: 'center',
      className: 'w-[160px]',
      render: (r) => {
        if (r.delivery === 'Failed') {
          return (
            <Button size="xs" leftIcon={<RotateCw className="size-[11px]" />} onClick={() => resend(r.id)}>
              Resend
            </Button>
          )
        }
        if (r.delivery === 'Scheduled' || r.delivery === 'Pending') {
          return (
            <Button size="xs" leftIcon={<Send className="size-[11px]" />} onClick={() => resend(r.id)}>
              Send Now
            </Button>
          )
        }
        return (
          <Button size="xs" variant="outline" leftIcon={<RotateCw className="size-[11px]" />}>
            View Message
          </Button>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader
        title="Customer Communication and Notification Management"
        underline
        showNavToggle
        onToggleNav={toggle}
      />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
        {/*
          Without an SMTP host nothing actually leaves the machine. The counters
          below are real, but they count log entries, not deliveries — so the
          screen has to say that rather than implying messages reached anyone.
        */}
        {statsQuery.data && !statsQuery.data.transportConfigured && (
          <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-gold-600/40 bg-[#FDF8EC] px-3.5 py-2.5 text-[11.5px] text-gold-700">
            <AlertTriangle className="size-[14px] shrink-0" strokeWidth={2.2} />
            <span>
              <b>No mail transport configured.</b> Messages are composed and recorded in the log
              below, but nothing is delivered until SMTP credentials are set on the server. SMS and
              WhatsApp need a gateway before they can send at all.
            </span>
          </div>
        )}

        <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {communicationStats.map((s) => {
            const Icon = statIcons[s.icon]
            return (
              <StatCard
                key={s.key}
                variant="solid"
                icon={<Icon />}
                label={s.label}
                value={s.value}
                delta={s.delta}
                trend={s.trend}
                caption="vs yesterday"
              />
            )
          })}
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
          <div className="grid min-w-0 gap-4">
            {/* 1) Upcoming reservation notifications */}
            <Card className="p-4">
              <SectionTitle
                action={
                  <Button size="sm" rightIcon={<ArrowRight className="size-[13px]" />}>
                    View All
                  </Button>
                }
              >
                1) Upcoming Reservation Notifications
              </SectionTitle>

              <div className="mt-3.5 overflow-hidden rounded-[10px] border border-line">
                <DataTable
                  columns={columns}
                  rows={notifications}
                  rowKey={(r) => r.id}
                  minWidth={1240}
                  emptyMessage="No scheduled notifications."
                />
              </div>
            </Card>

            <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
              {/* 2) Message templates */}
              <Card className="p-4">
                <SectionTitle>2) Message Templates</SectionTitle>

                <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                  {messageTemplates.map((t) => {
                    const Icon = templateIcons[t.icon]
                    return (
                      <article
                        key={t.id}
                        className="flex flex-col rounded-[10px] border border-line bg-white p-3 text-center"
                      >
                        <span
                          className="mx-auto flex size-[38px] items-center justify-center rounded-full"
                          style={{ background: `${t.color}1F`, color: t.color }}
                        >
                          <Icon className="size-[18px]" strokeWidth={2} />
                        </span>
                        <h3 className="mt-3 text-[12px] font-bold leading-snug text-ink">{t.title}</h3>
                        <p className="mt-2.5 flex-1 text-[11px] leading-[1.55] text-ink-muted">{t.body}</p>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="text-[11.5px] font-semibold text-ink">{t.channel}</span>
                          <Badge tone="active">Active</Badge>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          block
                          className="mt-2.5"
                          leftIcon={<Pencil className="size-[12px]" />}
                          onClick={() => setEditing(t)}
                        >
                          Edit
                        </Button>
                      </article>
                    )
                  })}
                </div>

                <div className="mt-4 flex justify-center border-t border-line pt-3">
                  <button
                    type="button"
                    className="focus-ring inline-flex items-center gap-1.5 rounded px-2 py-1 text-[12.5px] font-bold text-brand-700 transition hover:text-brand-600"
                  >
                    Manage All Templates <ArrowRight className="size-[13px]" />
                  </button>
                </div>
              </Card>

              {/* 3) Quick message panel */}
              <Card className="p-4">
                <SectionTitle>3) Quick Message Panel</SectionTitle>

                <div className="mt-3 grid gap-3">
                  <div>
                    <Label htmlFor="qm-res">Select Reservation</Label>
                    <Select
                      id="qm-res"
                      value={reservation}
                      onChange={(e) => setReservation(e.target.value)}
                      placeholder="Select reservation"
                      options={notifications.map((n) => ({
                        value: n.id,
                        label: `${n.customerName} — ${n.table}, ${n.timeSlot}`,
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="qm-type">Select Message Type</Label>
                    <Select
                      id="qm-type"
                      value={messageType}
                      onChange={(e) => setMessageType(e.target.value)}
                      placeholder="Select message type"
                      options={messageTemplates.map((t) => ({ value: t.id, label: t.title }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="qm-body">Message</Label>
                    <Textarea
                      id="qm-body"
                      rows={5}
                      maxLength={500}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here..."
                      counter={`${message.length}/500`}
                    />
                  </div>

                  <div>
                    <Label>Send Via</Label>
                    <div className="flex flex-wrap gap-2">
                      {channels.map((c) => {
                        const Icon = c === 'Email' ? Mail : c === 'SMS' ? MessageSquare : MessageCircle
                        return (
                          <button
                            key={c}
                            type="button"
                            aria-pressed={channel === c}
                            onClick={() => setChannel(c)}
                            className={cn(
                              'focus-ring inline-flex h-[36px] items-center gap-2 rounded-[8px] border px-3 text-[12.5px] font-semibold transition',
                              channel === c
                                ? 'border-brand-400 bg-brand-50 text-brand-700'
                                : 'border-line bg-white text-ink-soft hover:bg-line-soft',
                            )}
                          >
                            <Icon className="size-[14px]" />
                            {c}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <Button
                    block
                    size="lg"
                    leftIcon={<Send className="size-[16px]" />}
                    onClick={async () => {
                      if (!reservation.trim()) {
                        push({ tone: 'error', title: 'Enter a booking reference' })
                        return
                      }
                      const template = messageTemplates.find((t) => t.id === messageType)
                      try {
                        await api.post('/notifications/send', {
                          reference: reservation.trim(),
                          type: template?.title.includes('Reminder')
                            ? 'Reminder'
                            : template?.title.includes('Cancel')
                              ? 'Cancellation'
                              : template?.title.includes('Update')
                                ? 'Update'
                                : 'Confirmation',
                        })
                        setSentNotice(true)
                        setMessage('')
                        logQuery.refresh()
                        statsQuery.refresh()
                        activityQuery.refresh()
                      } catch (err) {
                        push({ tone: 'error', title: 'Message not sent', detail: messageOf(err) })
                      }
                    }}
                  >
                    Send Message
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Right rail */}
          <div className="grid h-fit gap-4">
            <Card className="p-4">
              <SectionTitle
                icon={<Sparkles className="size-[16px] text-gold-400" strokeWidth={2.2} />}
                action={
                  <button
                    type="button"
                    aria-label="Activity options"
                    className="focus-ring rounded p-1 text-ink-faint transition hover:text-ink"
                  >
                    <MoreVertical className="size-[15px]" />
                  </button>
                }
              >
                Communication Activity
              </SectionTitle>

              <ol className="relative mt-3.5">
                {communicationActivity.map((a, i) => (
                  <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < communicationActivity.length - 1 && (
                      <span className="absolute left-[13px] top-[26px] h-[calc(100%-20px)] w-px bg-gold-200" />
                    )}
                    <span
                      className={cn(
                        'relative z-10 flex size-[26px] shrink-0 items-center justify-center rounded-full border-2 bg-white',
                        a.tone === 'success' && 'border-state-success text-state-success',
                        a.tone === 'warn' && 'border-gold-400 text-gold-400',
                        a.tone === 'danger' && 'border-state-danger text-state-danger',
                      )}
                    >
                      {a.tone === 'success' && <CheckCircle2 className="size-[14px]" />}
                      {a.tone === 'warn' && <Clock className="size-[14px]" />}
                      {a.tone === 'danger' && <AlertTriangle className="size-[13px]" />}
                    </span>
                    <div className="min-w-0 border-b border-line-soft pb-3.5">
                      <p className="text-[10.5px] text-ink-faint">{a.time}</p>
                      <p className="mt-0.5 text-[12.5px] font-bold text-ink">{a.title}</p>
                      <p className="mt-0.5 text-[11.5px] text-ink-muted">{a.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <button
                type="button"
                className="focus-ring mt-1 inline-flex items-center gap-1.5 rounded px-1 py-1 text-[12px] font-bold text-brand-700 transition hover:text-brand-600"
              >
                View All Activity <ArrowRight className="size-[12px]" />
              </button>
            </Card>

            <Card className="p-4">
              <SectionTitle icon={<Settings className="size-[16px] text-gold-400" strokeWidth={2.2} />}>
                Notification Settings
              </SectionTitle>

              <ul className="mt-2.5 divide-y divide-line-soft">
                {settings.map((s) => (
                  <li key={s.id} className="flex items-start gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold leading-snug text-ink">{s.title}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">{s.detail}</p>
                    </div>
                    <Toggle
                      label={s.title}
                      checked={s.enabled}
                      onChange={(next) => void setSettings(s.id, next)}
                    />
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="focus-ring mt-2 inline-flex items-center gap-1.5 rounded px-1 py-1 text-[12px] font-bold text-brand-700 transition hover:text-brand-600"
              >
                Manage All Settings <ArrowRight className="size-[12px]" />
              </button>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Edit — ${editing.title}` : ''}
        subtitle={editing ? `Delivered via ${editing.channel}` : undefined}
        footer={
          <>
            <Button variant="outlineNeutral" size="sm" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => setEditing(null)}>
              Save Template
            </Button>
          </>
        }
      >
        {editing && (
          <div className="grid gap-3">
            <div>
              <Label htmlFor="tpl-body">Template body</Label>
              <Textarea id="tpl-body" rows={5} defaultValue={editing.body} />
            </div>
            <p className="text-[11.5px] text-ink-muted">
              Placeholders such as <code className="rounded bg-line-soft px-1">[name]</code>,{' '}
              <code className="rounded bg-line-soft px-1">[date]</code> and{' '}
              <code className="rounded bg-line-soft px-1">[table]</code> are replaced at send time.
            </p>
          </div>
        )}
      </Modal>

      <Modal
        open={sentNotice}
        onClose={() => setSentNotice(false)}
        title="Message queued"
        footer={
          <Button size="sm" onClick={() => setSentNotice(false)}>
            Done
          </Button>
        }
        width="max-w-[380px]"
      >
        <p className="text-[13px] text-ink-muted">
          The message was handed to the mock delivery queue. Wire this action to your messaging API
          to send for real.
        </p>
      </Modal>
    </>
  )
}
