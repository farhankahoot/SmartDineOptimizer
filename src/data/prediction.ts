export const predictionStats = [
  { key: 'revenue', label: 'Predicted Revenue', value: '₨ 312,450', caption: '18.6% vs Yesterday', trend: 'up' as const, color: '#7A1113', icon: 'dollar' as const },
  { key: 'footfall', label: 'Expected Footfall', value: '312', suffix: 'Guests', caption: '14.3% vs Yesterday', trend: 'up' as const, color: '#7A1113', icon: 'users' as const },
  { key: 'peak', label: 'Peak Hour', value: '8:00 PM', caption: 'Highest Traffic', trend: 'warn' as const, color: '#FFFFFF', icon: 'clock' as const },
  { key: 'shortage', label: 'Food Shortage Risk', value: 'Medium', caption: 'Monitor Closely', trend: 'warn' as const, color: '#E8871E', icon: 'alert' as const, valueColor: '#E8871E' },
  { key: 'wastage', label: 'Wastage Risk', value: 'Low', caption: 'Under Control', trend: 'down' as const, color: '#1E5B32', icon: 'trash' as const, valueColor: '#1E5B32' },
  { key: 'staff', label: 'Staff Requirement', value: '18', suffix: 'Staff', caption: '2 vs Yesterday', trend: 'up' as const, color: '#7A1113', icon: 'users' as const },
]

/** 1. Revenue and Sales Forecast */
export const revenueForecast = [
  { t: '12 AM', predicted: 400, actual: 320 },
  { t: '2 AM', predicted: 900, actual: 700 },
  { t: '4 AM', predicted: 1300, actual: 1100 },
  { t: '6 AM', predicted: 1900, actual: 1500 },
  { t: '8 AM', predicted: 3000, actual: 2200 },
  { t: '10 AM', predicted: 2950, actual: 2300 },
  { t: '12 PM', predicted: 4400, actual: 2800 },
  { t: '2 PM', predicted: 4650, actual: 3400 },
  { t: '4 PM', predicted: 6200, actual: 4300 },
  { t: '6 PM', predicted: 7200, actual: 4600 },
  { t: '8 PM', predicted: 6400, actual: 5100 },
  { t: '10 PM', predicted: 4700, actual: 4700 },
  { t: '12 AM ', predicted: 4600, actual: 4600 },
]

export const dailySalesForecast = [
  { day: 'Mon', value: 12000, highlight: false },
  { day: 'Tue', value: 11800, highlight: false },
  { day: 'Wed', value: 15300, highlight: false },
  { day: 'Thu', value: 16600, highlight: false },
  { day: 'Fri', value: 13500, highlight: false },
  { day: 'Sat', value: 16700, highlight: false },
  { day: 'Sun', value: 13600, highlight: true },
]

export const weeklySalesTrend = [
  { day: 'Mon', value: 10500 },
  { day: 'Tue', value: 20000 },
  { day: 'Wed', value: 17000 },
  { day: 'Thu', value: 23500 },
  { day: 'Fri', value: 25000 },
  { day: 'Sat', value: 32000 },
  { day: 'Sun', value: 25000 },
]

export const predictedVsActual = {
  predicted: 12450,
  actual: 10500,
  delta: '+18.6%',
  caption: 'vs Yesterday',
}

/** 2. Footfall and Peak Hours */
export const footfallByTimeSlot = [
  { t: '12 AM', v: 5 }, { t: '1 AM', v: 3 }, { t: '2 AM', v: 4 }, { t: '3 AM', v: 5 },
  { t: '4 AM', v: 17 }, { t: '5 AM', v: 14 }, { t: '6 AM', v: 15 }, { t: '7 AM', v: 26 },
  { t: '8 AM', v: 28 }, { t: '9 AM', v: 31 }, { t: '10 AM', v: 22 }, { t: '11 AM', v: 24 },
  { t: '12 PM', v: 44 }, { t: '1 PM', v: 42 }, { t: '2 PM', v: 41 }, { t: '3 PM', v: 46 },
  { t: '4 PM', v: 56 }, { t: '5 PM', v: 67 }, { t: '6 PM', v: 80 }, { t: '7 PM', v: 68 },
  { t: '8 PM', v: 60 }, { t: '9 PM', v: 47 }, { t: '10 PM', v: 28 },
]

export const heatmapHours = ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM', '12 AM']
export const heatmapDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
/** Row-major intensity 0–1, [hour][day]. */
export const heatmapValues: number[][] = [
  [0.10, 0.08, 0.12, 0.22, 0.24, 0.34, 0.30],
  [0.14, 0.10, 0.16, 0.20, 0.22, 0.28, 0.26],
  [0.40, 0.34, 0.30, 0.24, 0.22, 0.20, 0.18],
  [0.36, 0.32, 0.42, 0.50, 0.58, 0.72, 0.66],
  [0.30, 0.28, 0.38, 0.46, 0.54, 0.68, 0.60],
  [0.62, 0.58, 0.74, 0.86, 0.90, 0.96, 0.88],
  [0.44, 0.40, 0.56, 0.70, 0.78, 0.92, 0.84],
]

export const expectedGuestsByDay = [
  { day: 'Mon', value: 243, highlight: false },
  { day: 'Tue', value: 226, highlight: false },
  { day: 'Wed', value: 258, highlight: false },
  { day: 'Thu', value: 232, highlight: false },
  { day: 'Fri', value: 243, highlight: false },
  { day: 'Sat', value: 276, highlight: false },
  { day: 'Sun', value: 322, highlight: true },
]

export const busiestSlot = { range: '8:00 PM – 9:00 PM', footfall: '86 Guests' }

/** 3. Food Management Prediction */
export const predictedFoodDemand = [
  { item: 'Chicken', value: 96 },
  { item: 'Fried Rice', value: 83 },
  { item: 'Noodles', value: 71 },
  { item: 'Vegetables', value: 59 },
  { item: 'Beef', value: 49 },
  { item: 'Seafood', value: 40 },
  { item: 'Soup', value: 29 },
]

export const topDemanded = [
  { name: 'Chicken', pct: 85 },
  { name: 'Fried Rice', pct: 78 },
  { name: 'Noodles', pct: 72 },
  { name: 'Vegetables', pct: 58 },
  { name: 'Beef', pct: 46 },
]

export const lowDemanded = [
  { name: 'Seafood', pct: 22 },
  { name: 'Soup', pct: 25 },
  { name: 'Desserts', pct: 28 },
  { name: 'Tofu', pct: 30 },
  { name: 'Dim Sum', pct: 32 },
]

/** 4. Employee Requirement Prediction */
export const staffCards = [
  { label: 'Required Chefs', value: 6, delta: '1 vs Yesterday', trend: 'up' as const, icon: 'chef' as const },
  { label: 'Required Serving Staff', value: 9, delta: '2 vs Yesterday', trend: 'up' as const, icon: 'server' as const },
  { label: 'Required Cleaning Staff', value: 3, delta: 'No Change', trend: 'flat' as const, icon: 'cleaner' as const },
]

export const staffByShift = [
  { shift: 'Morning (7 AM - 3 PM)', chefs: 7, serving: 4, cleaning: 6 },
  { shift: 'Evening (3 PM - 11 PM)', chefs: 10, serving: 6, cleaning: 5 },
  { shift: 'Night (11 PM - 7 AM)', chefs: 7, serving: 6, cleaning: 6 },
]

export const staffGapAlert = {
  title: 'High Gap in Serving Staff',
  detail: 'Add 2 more serving staff for dinner shift.',
}

export const mlRecommendations = [
  { id: 'M1', text: 'High demand expected at 8:00 PM.', icon: 'clock' as const },
  { id: 'M2', text: 'Add 2 serving staff for dinner shift.', icon: 'staff' as const },
  { id: 'M3', text: 'Increase chicken and rice preparation.', icon: 'bowl' as const },
  { id: 'M4', text: 'Reduce seafood preparation today.', icon: 'fish' as const },
  { id: 'M5', text: '8:00 PM to 10:00 PM is the peak slot.', icon: 'chart' as const },
]

export const predictionFilters = {
  days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  timeSlots: ['All Day', 'Lunch (12 PM - 4 PM)', 'Dinner (6 PM - 10 PM)', 'Late Night'],
  forecastTypes: ['All', 'Revenue', 'Footfall', 'Food Demand', 'Staffing'],
}
