export interface Deal {
  id: string
  name: string
  category: string
  occasion: string
  price: string
  items: string
  active: boolean
}

export const deals: Deal[] = [
  { id: 'D1', name: 'Birthday Special', category: 'Special Occasion', occasion: 'Birthday', price: '₨1,499', items: 'Main Course, Starter, Cake, Mocktail, Decoration', active: true },
  { id: 'D2', name: 'Family Feast', category: 'Family Deals', occasion: 'Family Dinner', price: '₨2,199', items: '2 Starters, 3 Main Course, Rice/Noodles, Desserts', active: true },
  { id: 'D3', name: 'Business Dinner', category: 'Corporate Deals', occasion: 'Business', price: '₨1,799', items: 'Starter, Main Course, Rice, Beverage', active: true },
  { id: 'D4', name: 'Weekend Treat', category: 'Weekend Special', occasion: 'Weekend', price: '₨999', items: 'Starter, Main Course, Beverage, Dessert', active: true },
  { id: 'D5', name: 'Couple Dinner', category: 'Couple Deals', occasion: 'Anniversary / Date', price: '₨1,599', items: 'Starter, Main Course, Dessert, Candle Setup', active: false },
  { id: 'D6', name: 'Group Celebration Package', category: 'Group Deals', occasion: 'Group Celebration', price: '₨3,999', items: 'Multiple Starters, Main Course (Sharing), Desserts, Drinks', active: true },
]

export const dealCategories = [
  'Special Occasion',
  'Family Deals',
  'Corporate Deals',
  'Weekend Special',
  'Couple Deals',
  'Group Deals',
]

export const dealOccasions = [
  'Birthday',
  'Anniversary',
  'Anniversary / Date',
  'Family Dinner',
  'Business',
  'Weekend',
  'Group Celebration',
  'Other',
]

export const dealStats = [
  { key: 'active', label: 'Active Deals', value: '6', caption: 'Deals currently active', color: '#C0392B' },
  { key: 'birthday', label: 'Birthday Bookings', value: '18', caption: 'This Month', color: '#D9932B' },
  { key: 'family', label: 'Family Dinner Bookings', value: '32', caption: 'This Month', color: '#1E9E6A' },
  { key: 'pending', label: 'Pending Special Requests', value: '10', caption: 'Requires Attention', color: '#7B57C9' },
]

export const dealPerformance = {
  mostSelected: { title: 'Most Selected Deal', name: 'Family Feast', caption: 'Selected 32 times this month' },
  conversion: { title: 'Deal Conversion Rate', value: '28.6%', delta: '+4.3%', caption: 'vs last month' },
  revenue: { title: 'Revenue from Deals', value: '₨1,48,250', caption: 'This Month' },
  lowPerforming: { title: 'Low-performing Deal', name: 'Couple Dinner', caption: 'Selected 3 times this month' },
}
