export type RequestStatus = 'Pending' | 'In Progress' | 'Accepted' | 'Completed'

export interface SpecialRequest {
  id: string
  customerName: string
  reservationId: string
  date: string
  timeSlot: string
  table: string
  occasion: string
  request: string
  status: RequestStatus
}

export const specialRequests: SpecialRequest[] = [
  { id: 'SR1', customerName: 'Rahul Sharma', reservationId: 'RES-2025-1234', date: '18 May 2025', timeSlot: '7:00 PM - 9:00 PM', table: 'T-12', occasion: 'Birthday', request: 'Birthday decoration and cake arrangement', status: 'Pending' },
  { id: 'SR2', customerName: 'Priya Mehta', reservationId: 'RES-2025-1235', date: '18 May 2025', timeSlot: '8:00 PM - 10:00 PM', table: 'T-08', occasion: 'Business', request: 'Private corner table for 6 people', status: 'In Progress' },
  { id: 'SR3', customerName: 'Anil & Family', reservationId: 'RES-2025-1236', date: '19 May 2025', timeSlot: '1:00 PM - 3:00 PM', table: 'T-15', occasion: 'Family Dinner', request: 'Family seating with kids friendly setup', status: 'Accepted' },
  { id: 'SR4', customerName: 'Sneha Iyer', reservationId: 'RES-2025-1237', date: '19 May 2025', timeSlot: '7:30 PM - 9:30 PM', table: 'T-07', occasion: 'Date / Anniversary', request: 'No spicy food, please', status: 'Completed' },
  { id: 'SR5', customerName: 'Vikram Singh', reservationId: 'RES-2025-1238', date: '20 May 2025', timeSlot: '6:30 PM - 8:30 PM', table: 'T-11', occasion: 'Family Dinner', request: 'High chair required for toddler', status: 'Pending' },
  { id: 'SR6', customerName: 'Aditi Rao', reservationId: 'RES-2025-1239', date: '20 May 2025', timeSlot: '8:00 PM - 10:00 PM', table: 'T-09', occasion: 'Other', request: 'Allergy to nuts (please note)', status: 'In Progress' },
  { id: 'SR7', customerName: 'Karan & Neha', reservationId: 'RES-2025-1240', date: '21 May 2025', timeSlot: '7:00 PM - 9:00 PM', table: 'T-06', occasion: 'Anniversary', request: 'Anniversary setup with candles', status: 'Pending' },
]

export const requestAlerts = [
  { id: 'A1', count: 5, text: 'Birthday setup requests pending', icon: 'cake' as const, color: '#C0392B' },
  { id: 'A2', count: 2, text: 'Allergy-related requests need attention', icon: 'alert' as const, color: '#D9932B' },
  { id: 'A3', count: 3, text: 'Private table requests for tonight', icon: 'table' as const, color: '#2F6FD0' },
]
