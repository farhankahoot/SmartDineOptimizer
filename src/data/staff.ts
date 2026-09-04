/** Module 4 FE-4: the four staff categories the proposal names. */
export type StaffRole = 'Chef' | 'Serving Staff' | 'Cleaning Staff' | 'Service Staff'
export type Shift = 'Morning' | 'Evening' | 'Night'
export type StaffAvailability = 'Available' | 'On Shift' | 'Off Duty' | 'On Leave'

export interface StaffMember {
  id: string
  name: string
  role: StaffRole
  phone: string
  shift: Shift
  availability: StaffAvailability
  joined: string
}

export const shiftHours: Record<Shift, string> = {
  Morning: '7:00 AM – 3:00 PM',
  Evening: '3:00 PM – 11:00 PM',
  Night: '11:00 PM – 7:00 AM',
}

export const staffMembers: StaffMember[] = [
  { id: 'ST-01', name: 'Imran Yousaf', role: 'Chef', phone: '+92 300 445 1122', shift: 'Evening', availability: 'On Shift', joined: '12 Jan 2023' },
  { id: 'ST-02', name: 'Adeel Raza', role: 'Chef', phone: '+92 321 887 3390', shift: 'Morning', availability: 'Available', joined: '03 Mar 2023' },
  { id: 'ST-03', name: 'Zubair Ahmed', role: 'Chef', phone: '+92 333 220 5566', shift: 'Evening', availability: 'On Shift', joined: '19 Jun 2023' },
  { id: 'ST-04', name: 'Kamran Shah', role: 'Chef', phone: '+92 345 991 2020', shift: 'Night', availability: 'Off Duty', joined: '08 Sep 2023' },
  { id: 'ST-05', name: 'Hamza Tariq', role: 'Chef', phone: '+92 311 664 7788', shift: 'Evening', availability: 'On Shift', joined: '25 Nov 2023' },
  { id: 'ST-06', name: 'Naveed Akhtar', role: 'Chef', phone: '+92 302 118 4433', shift: 'Morning', availability: 'On Leave', joined: '14 Feb 2024' },
  { id: 'ST-07', name: 'Usman Javed', role: 'Serving Staff', phone: '+92 300 776 9911', shift: 'Evening', availability: 'On Shift', joined: '02 Apr 2023' },
  { id: 'ST-08', name: 'Sana Bibi', role: 'Serving Staff', phone: '+92 322 445 6677', shift: 'Evening', availability: 'On Shift', joined: '17 May 2023' },
  { id: 'ST-09', name: 'Fahad Nazir', role: 'Serving Staff', phone: '+92 313 909 1122', shift: 'Morning', availability: 'Available', joined: '21 Jul 2023' },
  { id: 'ST-10', name: 'Rimsha Iqbal', role: 'Serving Staff', phone: '+92 334 556 8899', shift: 'Evening', availability: 'On Shift', joined: '30 Aug 2023' },
  { id: 'ST-11', name: 'Waleed Anwar', role: 'Serving Staff', phone: '+92 301 223 3344', shift: 'Night', availability: 'Off Duty', joined: '11 Oct 2023' },
  { id: 'ST-12', name: 'Ayesha Noor', role: 'Serving Staff', phone: '+92 345 667 1100', shift: 'Evening', availability: 'Available', joined: '06 Jan 2024' },
  { id: 'ST-13', name: 'Tahir Mehmood', role: 'Serving Staff', phone: '+92 300 334 9922', shift: 'Morning', availability: 'On Shift', joined: '18 Mar 2024' },
  { id: 'ST-14', name: 'Bilal Aslam', role: 'Cleaning Staff', phone: '+92 321 445 2233', shift: 'Morning', availability: 'On Shift', joined: '09 Feb 2023' },
  { id: 'ST-15', name: 'Rashid Ali', role: 'Cleaning Staff', phone: '+92 333 778 5544', shift: 'Evening', availability: 'On Shift', joined: '23 Jun 2023' },
  { id: 'ST-16', name: 'Nadia Perveen', role: 'Cleaning Staff', phone: '+92 312 990 6677', shift: 'Night', availability: 'Available', joined: '15 Dec 2023' },
  { id: 'ST-17', name: 'Shahid Mahmood', role: 'Service Staff', phone: '+92 302 445 8877', shift: 'Evening', availability: 'On Shift', joined: '04 May 2023' },
  { id: 'ST-18', name: 'Erum Shafiq', role: 'Service Staff', phone: '+92 344 221 3355', shift: 'Morning', availability: 'Available', joined: '28 Aug 2023' },
]

/**
 * Module 4 FE-6 / Module 5 FE-4 — required head-count per shift compared with
 * the roster, so the gap is visible before service starts.
 */
export interface AllocationRow {
  shift: Shift
  expectedGuests: number
  reservations: number
  requiredChefs: number
  requiredServing: number
  requiredCleaning: number
}

export const allocationPlan: AllocationRow[] = [
  { shift: 'Morning', expectedGuests: 64, reservations: 14, requiredChefs: 3, requiredServing: 4, requiredCleaning: 2 },
  { shift: 'Evening', expectedGuests: 186, reservations: 41, requiredChefs: 6, requiredServing: 9, requiredCleaning: 3 },
  { shift: 'Night', expectedGuests: 62, reservations: 11, requiredChefs: 3, requiredServing: 4, requiredCleaning: 2 },
]

export const staffRoles: StaffRole[] = ['Chef', 'Serving Staff', 'Cleaning Staff', 'Service Staff']
export const shifts: Shift[] = ['Morning', 'Evening', 'Night']
export const availabilities: StaffAvailability[] = ['Available', 'On Shift', 'Off Duty', 'On Leave']
