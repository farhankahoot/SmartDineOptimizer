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
  communicationActivity,
  communicationStats,
  messageTemplates,
  notificationSettings,
  notifications,
  type DeliveryStatus,
  type MessageTemplate,
  type NotificationRow,
  type NotificationStatus,
} from '@/data/communication'

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
  const [settings, setSettings] = useState(notificationSettings)
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
            <Button size="xs" leftIcon={<RotateCw className="size-[11px]" />} onClick={() => setSentNotice(true)}>
              Resend
            </Button>
          )
        }
        if (r.delivery === 'Scheduled' || r.delivery === 'Pending') {
          return (
            <Button size="xs" leftIcon={<Send className="size-[11px]" />} onClick={() => setSentNotice(true)}>
              Send Reminder
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
        notificationCount={8}
        profileName="Admin"
        profileRole="Restaurant Admin"
        showNavToggle
        onToggleNav={toggle}
      />

      <div className="grid gap-4 px-[var(--page-pad-x)] py-[var(--page-pad-y)]">
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
                    onClick={() => {
                      setSentNotice(true)
                      setMessage('')
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
                      onChange={(next) =>
                        setSettings((prev) =>
                          prev.map((x) => (x.id === s.id ? { ...x, enabled: next } : x)),
                        )
                      }
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
