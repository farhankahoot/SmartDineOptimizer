/**
 * Public restaurant showcase.
 *
 * Scope note: the proposal (LI-1) keeps the *operational* system single-restaurant.
 * These records are marketing content for the public site — a curated directory of
 * Pakistani restaurants — not additional tenants of the reservation console.
 */
export type ShowcaseStatus = 'Active' | 'Pending' | 'Suspended' | 'Inactive' | 'Rejected'

export const showcaseStatuses: ShowcaseStatus[] = [
  'Active',
  'Pending',
  'Suspended',
  'Inactive',
  'Rejected',
]

export const provinces = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Gilgit-Baltistan',
  'Azad Jammu & Kashmir',
] as const

export type Province = (typeof provinces)[number]

/** Seed list — the admin can add any other city from the Showcase Manager. */
export const cities: { name: string; province: Province }[] = [
  { name: 'Lahore', province: 'Punjab' },
  { name: 'Islamabad', province: 'Islamabad Capital Territory' },
  { name: 'Rawalpindi', province: 'Punjab' },
  { name: 'Karachi', province: 'Sindh' },
  { name: 'Peshawar', province: 'Khyber Pakhtunkhwa' },
  { name: 'Quetta', province: 'Balochistan' },
  { name: 'Multan', province: 'Punjab' },
  { name: 'Faisalabad', province: 'Punjab' },
  { name: 'Gujranwala', province: 'Punjab' },
  { name: 'Sialkot', province: 'Punjab' },
  { name: 'Hyderabad', province: 'Sindh' },
  { name: 'Bahawalpur', province: 'Punjab' },
  { name: 'Sargodha', province: 'Punjab' },
  { name: 'Abbottabad', province: 'Khyber Pakhtunkhwa' },
  { name: 'Murree', province: 'Punjab' },
]

export const cuisines = [
  'Pan Asian',
  'Pakistani',
  'BBQ & Grill',
  'Continental',
  'Chinese',
  'Fast Food',
  'Seafood',
  'Cafe & Bakery',
  'Fine Dining',
  'Afghan',
]

export interface Restaurant {
  id: string
  name: string
  city: string
  province: Province
  cuisine: string
  description: string
  /** Optional uploaded image (data URL in this build). Falls back to a generated cover. */
  image?: string
  /** Two-stop gradient used when no image has been uploaded. */
  cover: [string, string]
  website?: string
  featured: boolean
  status: ShowcaseStatus
  /** Position in the public carousel; lower shows first. */
  order: number
  addedOn: string
}

/**
 * Cover gradients keep the showcase looking intentional before real photography
 * is uploaded — no stock imagery, no fabricated brand assets.
 */
export const restaurants: Restaurant[] = [
  {
    id: 'RS-01',
    name: 'Asian Wok by Monal',
    city: 'Islamabad',
    province: 'Islamabad Capital Territory',
    cuisine: 'Pan Asian',
    description:
      'Pan-Asian dining on the Margalla foothills. The first restaurant running SmartDine Optimizer end to end.',
    cover: ['#7A1113', '#2A1410'],
    website: 'https://asianwok.pk',
    featured: true,
    status: 'Active',
    order: 1,
    addedOn: '02 Jan 2025',
  },
  {
    id: 'RS-02',
    name: 'Andaaz Restaurant',
    city: 'Lahore',
    province: 'Punjab',
    cuisine: 'Pakistani',
    description: 'Rooftop Mughal dining with a view of the Badshahi Mosque in the Walled City.',
    cover: ['#8E4B14', '#2A1A10'],
    featured: true,
    status: 'Active',
    order: 2,
    addedOn: '14 Jan 2025',
  },
  {
    id: 'RS-03',
    name: 'Kolachi Seaview',
    city: 'Karachi',
    province: 'Sindh',
    cuisine: 'Seafood',
    description: 'Seaside dining at Do Darya with a coastal grill and family seating terraces.',
    cover: ['#12495E', '#0D1F2A'],
    featured: true,
    status: 'Active',
    order: 3,
    addedOn: '22 Jan 2025',
  },
  {
    id: 'RS-04',
    name: 'Chief Burger & Grill',
    city: 'Peshawar',
    province: 'Khyber Pakhtunkhwa',
    cuisine: 'BBQ & Grill',
    description: 'Charcoal grill and chapli kebab house serving the old city since the 1980s.',
    cover: ['#6B3410', '#241209'],
    featured: true,
    status: 'Active',
    order: 4,
    addedOn: '03 Feb 2025',
  },
  {
    id: 'RS-05',
    name: 'Lal Qila Multan',
    city: 'Multan',
    province: 'Punjab',
    cuisine: 'Fine Dining',
    description: 'Heritage-themed banquet dining with private halls for family and corporate events.',
    cover: ['#5E1338', '#22101B'],
    featured: false,
    status: 'Active',
    order: 5,
    addedOn: '11 Feb 2025',
  },
  {
    id: 'RS-06',
    name: 'Cafe Zouk Gulberg',
    city: 'Lahore',
    province: 'Punjab',
    cuisine: 'Continental',
    description: 'Contemporary continental menu and a courtyard cafe in the heart of Gulberg.',
    cover: ['#1F5140', '#0F211C'],
    featured: false,
    status: 'Active',
    order: 6,
    addedOn: '19 Feb 2025',
  },
  {
    id: 'RS-07',
    name: 'Usmania Quetta',
    city: 'Quetta',
    province: 'Balochistan',
    cuisine: 'Afghan',
    description: 'Sajji, kabuli pulao and Balochi grill served in traditional floor seating.',
    cover: ['#7A5A16', '#251C0C'],
    featured: false,
    status: 'Active',
    order: 7,
    addedOn: '27 Feb 2025',
  },
  {
    id: 'RS-08',
    name: 'Pearl Continental Terrace',
    city: 'Rawalpindi',
    province: 'Punjab',
    cuisine: 'Fine Dining',
    description: 'Hotel fine dining with a buffet terrace and dedicated event floors.',
    cover: ['#243B70', '#101828'],
    featured: false,
    status: 'Active',
    order: 8,
    addedOn: '05 Mar 2025',
  },
  {
    id: 'RS-09',
    name: 'Highland Cafe Murree',
    city: 'Murree',
    province: 'Punjab',
    cuisine: 'Cafe & Bakery',
    description: 'Hill-station cafe on Mall Road with a bakery counter and mountain-view seating.',
    cover: ['#2E4A3A', '#131F19'],
    featured: false,
    status: 'Pending',
    order: 9,
    addedOn: '18 Mar 2025',
  },
  {
    id: 'RS-10',
    name: 'Bundu Khan Faisalabad',
    city: 'Faisalabad',
    province: 'Punjab',
    cuisine: 'BBQ & Grill',
    description: 'Traditional Lahori BBQ with open-kitchen seekh and karahi stations.',
    cover: ['#6E2A16', '#25120C'],
    featured: false,
    status: 'Inactive',
    order: 10,
    addedOn: '24 Mar 2025',
  },
]

/**
 * The carousel renders its image inside an `aspect-[16/10]` container with
 * `object-fit: cover`, so uploads are recommended at 2× the largest rendered
 * card width (800px) to stay sharp on high-density screens.
 */
export const IMAGE_GUIDANCE = {
  width: 1600,
  height: 1000,
  ratio: '16:10',
  ratioValue: 1.6,
  maxBytes: 2 * 1024 * 1024,
  maxLabel: '2 MB',
  formats: ['image/jpeg', 'image/png', 'image/webp'],
  formatLabel: 'JPG, PNG or WebP',
} as const
