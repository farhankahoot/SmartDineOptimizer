/**
 * Landing-page copy. Every claim traces back to the project proposal — module
 * features, business objectives (BO-*) or the stated scope. Nothing here
 * invents customers, revenue figures, testimonials or awards.
 */

/** Problem statement, p.4–5 of the proposal. */
export const problems = [
  {
    title: 'Bookings arrive everywhere at once',
    detail:
      'Phone calls, WhatsApp messages, walk-ins and basic web forms leave no single record — so bookings get missed or double-booked.',
  },
  {
    title: 'Guests never know where they stand',
    detail:
      'Without live table availability or confirmations, customers face unclear booking status, delayed replies and waiting time on arrival.',
  },
  {
    title: 'Demand is a guess',
    detail:
      'Managers cannot tell how many guests will arrive on a given day or slot, which makes table, food and staff planning guesswork.',
  },
  {
    title: 'Food and staffing swing between extremes',
    detail:
      'Over-preparing off-peak creates wastage; under-preparing at peak creates shortages, while shift cover is planned blind.',
  },
]

/** The eight modules of the system. */
export const modules = [
  {
    id: 'reservation',
    icon: 'calendar',
    title: 'Customer Reservation',
    detail:
      'Guests book in 1–2 minutes with date, time slot, party size, occasion type, seating preference and special requests — and see the table layout before they commit.',
  },
  {
    id: 'admin',
    icon: 'listChecks',
    title: 'Admin Reservation Management',
    detail:
      'Confirm, reject, update or cancel every request from one worklist. Search and filter by date, slot, name, party size, occasion or status.',
  },
  {
    id: 'tables',
    icon: 'table',
    title: 'Table & Time Slot Management',
    detail:
      'Maintain tables, capacity, type and seating section; build lunch, dinner and peak-hour slots; and stop the same table being booked twice.',
  },
  {
    id: 'deals',
    icon: 'tag',
    title: 'Food Deals & Staff Records',
    detail:
      'Publish occasion-based deals, track customer special requests, and keep chef, serving, cleaning and service staff records with shift availability.',
  },
  {
    id: 'prediction',
    icon: 'brain',
    title: 'Prediction Models',
    detail:
      'Machine-learning forecasts for footfall, revenue, food wastage and shortage risk, employee requirement, peak hours and future sales.',
  },
  {
    id: 'dashboard',
    icon: 'gauge',
    title: 'Real-Time Dashboard & Reporting',
    detail:
      'KPI cards, footfall and revenue charts, peak-hour insight, alerts and recommendations — plus daily, weekly and monthly reports.',
  },
  {
    id: 'database',
    icon: 'database',
    title: 'Centralised Database',
    detail:
      'Customers, reservations, tables, slots, deals, staff, sales and prediction outputs live in one store that keeps history for future forecasting.',
  },
  {
    id: 'access',
    icon: 'shield',
    title: 'Access & Notifications',
    detail:
      'Secure sign-in with admin, manager and staff roles, plus confirmation, reminder and cancellation messages over email, SMS or WhatsApp.',
  },
] as const

/** BO-* objectives, worded as capabilities rather than guarantees. */
export const objectives = [
  {
    metric: '1–2 min',
    label: 'to complete a booking',
    note: 'BO-1 — a structured reservation form replaces phone and WhatsApp back-and-forth.',
  },
  {
    metric: '20%',
    label: 'target cut in double & missed bookings',
    note: 'BO-4 — real-time table and slot availability, measured during pilot testing.',
  },
  {
    metric: '25%',
    label: 'target cut in unclear bookings',
    note: 'BO-5 — automatic confirmation and reminder messages.',
  },
  {
    metric: '15%',
    label: 'target cut in food wastage',
    note: 'BO-9 — ML food-demand prediction with shortage and wastage risk.',
  },
]

/** How the product is actually used, end to end. */
export const workflow = [
  {
    step: '01',
    title: 'Configure your restaurant',
    detail:
      'Set your profile, operating hours, tables and seating sections, time slots and reservation rules. The system is plug-and-play — no code changes to adopt it.',
    to: '/login',
    linkLabel: 'See the settings module',
  },
  {
    step: '02',
    title: 'Take bookings online',
    detail:
      'Guests pick a date, slot, party size, occasion and table from the live floor plan, then receive a booking reference they can track.',
    to: '/reserve',
    linkLabel: 'Try the booking page',
  },
  {
    step: '03',
    title: 'Manage the service',
    detail:
      'Confirm or reject requests, handle special requests, keep table status current and send confirmations and reminders automatically.',
    to: '/login',
    linkLabel: 'Open the console',
  },
  {
    step: '04',
    title: 'Predict and plan ahead',
    detail:
      'Read forecast footfall, revenue, food demand and staffing on the dashboard, then act on the alerts and recommendations before service starts.',
    to: '/login',
    linkLabel: 'View the analytics',
  },
]

/** Answers drawn from the proposal's scope and limitations sections. */
export const faqs = [
  {
    q: 'Who is SmartDine Optimizer built for?',
    a: 'Premium dine-in restaurants that take reservations for family dinners, birthdays, business dinners and special occasions, and the administrators who plan those services. The first version is configured for a single restaurant.',
  },
  {
    q: 'What can guests do without an account?',
    a: 'Guests do not need an account. They submit a reservation request with their contact details and preferences, receive a booking reference, and use that reference to track whether the booking is pending, confirmed, updated, rejected or cancelled.',
  },
  {
    q: 'How do the predictions work?',
    a: 'Models built with Python, Pandas, NumPy and Scikit-learn learn from historical reservation, sales, food-usage and staffing records to forecast footfall, revenue, food demand, wastage and shortage risk, employee requirement and peak hours. Where real restaurant data is unavailable, simulated data based on realistic scenarios is used for training and demonstration.',
  },
  {
    q: 'Are the forecasts decisions or suggestions?',
    a: 'Suggestions. The prediction models provide decision support only — the restaurant retains every final decision on reservations, food preparation, staffing and operational planning.',
  },
  {
    q: 'Can it run more than one restaurant?',
    a: 'Not in this version. The system is designed plug-and-play so another restaurant can be configured later by updating the restaurant profile, tables, slots, deals, dashboard settings and prediction inputs — but each still needs its own layout, rules and historical data.',
  },
  {
    q: 'Does it handle payments or delivery?',
    a: 'No. This version covers dine-in reservation management and operational planning. Online payment gateways, food delivery, full POS billing, payroll and complete HR management are outside its scope, and there is no mobile app — it is a web-based system.',
  },
  {
    q: 'How are customers notified?',
    a: 'Confirmation, reminder, update and cancellation messages are sent over email, SMS or WhatsApp once an administrator approves or changes a booking, using configurable message templates.',
  },
]

/** Comparison with what local restaurant sites offer today (proposal p.7–8). */
export const comparison = [
  { capability: 'Structured reservation form', typical: true, smartdine: true },
  { capability: 'Live table availability before booking', typical: false, smartdine: true },
  { capability: 'Booking status tracking for guests', typical: false, smartdine: true },
  { capability: 'Automatic confirmation & reminders', typical: false, smartdine: true },
  { capability: 'Table, slot and double-booking control', typical: false, smartdine: true },
  { capability: 'Footfall & revenue prediction', typical: false, smartdine: true },
  { capability: 'Food wastage & shortage risk', typical: false, smartdine: true },
  { capability: 'Employee requirement planning', typical: false, smartdine: true },
  { capability: 'Real-time operations dashboard', typical: false, smartdine: true },
]

export const techStack = [
  'WordPress',
  'PHP 8',
  'MySQL 8',
  'REST API',
  'Python 3',
  'Scikit-learn',
  'Pandas',
  'NumPy',
  'Chart.js',
  'SMTP / WhatsApp API',
]
