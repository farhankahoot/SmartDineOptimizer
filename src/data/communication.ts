export type NotificationStatus = 'Confirmed' | 'Cancelled' | 'Pending'
export type DeliveryStatus = 'Sent' | 'Scheduled' | 'Pending' | 'Failed'

export interface NotificationRow {
  id: string
  customerName: string
  phone: string
  email: string
  date: string
  timeSlot: string
  table: string
  status: NotificationStatus
  type: string
  delivery: DeliveryStatus
}

export const notifications: NotificationRow[] = [
  { id: 'N1', customerName: 'Ayesha Khan', phone: '+92 312 555 0192', email: 'ayesha.khan@gmail.com', date: 'May 24, 2025', timeSlot: '7:00 PM', table: 'Table 12', status: 'Confirmed', type: 'Confirmation', delivery: 'Sent' },
  { id: 'N2', customerName: 'Usman Ali', phone: '+92 300 777 2233', email: 'usman.ali@example.com', date: 'May 24, 2025', timeSlot: '8:00 PM', table: 'Table 8', status: 'Confirmed', type: 'Reminder', delivery: 'Scheduled' },
  { id: 'N3', customerName: 'Sara Malik', phone: '+92 321 444 8899', email: 'sara.malik@gmail.com', date: 'May 24, 2025', timeSlot: '8:30 PM', table: 'Table 15', status: 'Confirmed', type: 'Reminder', delivery: 'Pending' },
  { id: 'N4', customerName: 'Bilal Ahmed', phone: '+92 333 222 3344', email: 'bilal.ahmed@example.com', date: 'May 24, 2025', timeSlot: '9:00 PM', table: 'Table 6', status: 'Confirmed', type: 'Update', delivery: 'Sent' },
  { id: 'N5', customerName: 'Mehwish Tariq', phone: '+92 322 555 7777', email: 'mehwish.tariq@gmail.com', date: 'May 25, 2025', timeSlot: '7:30 PM', table: 'Table 3', status: 'Confirmed', type: 'Confirmation', delivery: 'Sent' },
  { id: 'N6', customerName: 'Ahmad Raza', phone: '+92 311 999 1122', email: 'ahmad.raza@example.com', date: 'May 25, 2025', timeSlot: '8:00 PM', table: 'Table 10', status: 'Confirmed', type: 'Reminder', delivery: 'Scheduled' },
  { id: 'N7', customerName: 'Komal Shah', phone: '+92 300 888 6677', email: 'komal.shah@gmail.com', date: 'May 25, 2025', timeSlot: '9:00 PM', table: 'Table 2', status: 'Cancelled', type: 'Cancellation', delivery: 'Sent' },
  { id: 'N8', customerName: 'Omar Farooq', phone: '+92 334 123 4567', email: 'omar.farooq@gmail.com', date: 'May 25, 2025', timeSlot: '7:00 PM', table: 'Table 7', status: 'Pending', type: 'Confirmation', delivery: 'Failed' },
]

export const communicationStats = [
  { key: 'sent', label: 'Messages Sent Today', value: '158', delta: '12%', trend: 'up' as const, icon: 'send' as const },
  { key: 'confirmations', label: 'Confirmations Sent', value: '86', delta: '8%', trend: 'up' as const, icon: 'mail' as const },
  { key: 'reminders', label: 'Reminders Scheduled', value: '72', delta: '15%', trend: 'up' as const, icon: 'bell' as const },
  { key: 'pending', label: 'Pending Notifications', value: '24', delta: '6%', trend: 'flat' as const, icon: 'clock' as const },
  { key: 'success', label: 'Delivery Success Rate', value: '96.2%', delta: '3.4%', trend: 'up' as const, icon: 'shield' as const },
]

export type TemplateChannel = 'Email' | 'SMS' | 'WhatsApp'

export interface MessageTemplate {
  id: string
  title: string
  body: string
  channel: TemplateChannel
  active: boolean
  icon: 'mail' | 'chat' | 'edit' | 'cancel' | 'whatsapp'
  color: string
}

export const messageTemplates: MessageTemplate[] = [
  { id: 'T1', title: 'Reservation Confirmation', body: 'Hi [name], your reservation for [date] at [time] is confirmed. Table: [table]. Thank you!', channel: 'Email', active: true, icon: 'mail', color: '#2E9E63' },
  { id: 'T2', title: 'Reservation Reminder', body: 'Hi [name], this is a reminder for your reservation on [date] at [time]. We look forward to serving you!', channel: 'Email', active: true, icon: 'chat', color: '#3A7BD5' },
  { id: 'T3', title: 'Reservation Update', body: 'Hi [name], your reservation has been updated. New details: [date], [time], [table]. Thank you!', channel: 'Email', active: true, icon: 'edit', color: '#7B57C9' },
  { id: 'T4', title: 'Reservation Cancellation', body: 'Hi [name], your reservation for [date] at [time] has been cancelled. We hope to see you again soon.', channel: 'Email', active: true, icon: 'cancel', color: '#D9534F' },
  { id: 'T5', title: 'Special Request Confirmation', body: 'Hi [name], your special request has been noted. We will take care of it!', channel: 'Email', active: true, icon: 'whatsapp', color: '#25A65B' },
]

export const communicationActivity = [
  { id: 'C1', time: '12:45 PM', title: 'Latest confirmation sent', detail: 'To Ayesha Khan (Table 12) via SMS', tone: 'success' as const },
  { id: 'C2', time: '11:30 AM', title: 'Reminder scheduled', detail: 'For 8:00 PM booking (Usman Ali)', tone: 'warn' as const },
  { id: 'C3', time: '10:15 AM', title: 'Failed message needs resend', detail: 'To Omar Farooq (Table 7) via Email', tone: 'danger' as const },
  { id: 'C4', time: '09:05 AM', title: 'Cancellation message delivered', detail: 'To Komal Shah (Table 2) via WhatsApp', tone: 'success' as const },
]

export const notificationSettings = [
  { id: 'S1', title: 'Send confirmation after admin approval', detail: 'Automatically send confirmation once reservation is approved.', enabled: true },
  { id: 'S2', title: 'Send reminder 2 hours before reservation', detail: 'Send automatic reminder before the reservation time.', enabled: true },
  { id: 'S3', title: 'Send cancellation message automatically', detail: 'Notify customers automatically when a reservation is cancelled.', enabled: true },
  { id: 'S4', title: 'Allow manual resend', detail: 'Enable admins to resend failed or pending notifications manually.', enabled: true },
]
