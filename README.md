# SmartDine Optimizer — Asian Wok

Frontend for the **plug-and-play restaurant reservation and ML-based predictive
operations management system** described in the project proposal.

Two sources drive this codebase:

- **`FYP proposal.pdf`** — the product requirements (modules, features, roles,
  objectives). It decides *what* exists.
- **`mockupimg/`** — the client's screen designs. They decide *how* the seven
  mocked screens look; those are reproduced rather than reinterpreted.

## Running it

```bash
npm install
```

```bash
npm run dev
```

`npm run build` produces a production bundle, `npm run lint` type-checks.

### Demo accounts

| Role | Email | Password | Sees |
| --- | --- | --- | --- |
| Super Admin | `super@asianwok.pk` | `super123` | Everything, plus the Control Centre |
| Administrator | `admin@asianwok.pk` | `admin123` | The restaurant console |
| Manager | `manager@asianwok.pk` | `manager123` | All modules, read-only settings |
| Staff | `floor@asianwok.pk` | `staff123` | Reservations, tables, slots, deals, staff, communication |

## Routes

### Public site
| Route | Screen | Requirement |
| --- | --- | --- |
| `/` | Marketing landing page — hero, live product preview, modules, workflow, prediction, FAQ | Proposal overview |
| `/reserve` | Reserve Your Table (+ floor plan, seating preference, success state) | Module 1 FE-1…FE-5, BO-2 |
| `/track` | Track Your Reservation — status + history by reference | Module 1 FE-6 |

The landing page includes a **Pakistan restaurant showcase** — an autoplaying,
keyboard- and swipe-driven carousel filtered by province. Every card comes from
the Control Centre; nothing on it is hardcoded.

The landing page reuses the console's own components — `StatCard`, `Card`,
`Badge`, `Button`, `FloorPlan` and the real dashboard charts — so the product
preview *is* the product, not a mock-up of it. There is no public sign-up: the
proposal provisions accounts by invitation (Module 8 FE-2), so the CTAs point at
`/reserve` for guests and `/login` for staff.

### Authentication
| Route | Screen | Requirement |
| --- | --- | --- |
| `/login` | Sign in | Module 8 FE-1 |
| `/forgot-password` | Request a reset link | Module 8 FE-1 |
| `/reset-password` | Choose a new password | Module 8 FE-1 |

### Admin console (auth + permission guarded)
| Route | Screen | Requirement |
| --- | --- | --- |
| `/admin` | Real-Time Operations Dashboard | Module 6 FE-1…FE-8 |
| `/admin/reservations` | Reservation worklist + history tab | Module 2 FE-1…FE-6 |
| `/admin/reservations/:id` | Single booking, actions, status trail | Module 2 FE-2/FE-4/FE-5 |
| `/admin/tables` | Floor plan, table CRUD, availability checker | Module 3 FE-1…FE-6 |
| `/admin/time-slots` | Slot CRUD, open/close | Module 3 FE-3 |
| `/admin/food-deals` | Deals CRUD + customer special requests | Module 4 FE-1…FE-3 |
| `/admin/staff` | Staff records, availability, allocation planning | Module 4 FE-4…FE-6 |
| `/admin/communication` | Notifications, templates, quick message | Module 8 FE-5…FE-8 |
| `/admin/prediction` | Prediction and Analytics Dashboard | Module 5 FE-1…FE-7 |
| `/admin/reports` | Daily / weekly / monthly reports + export | Module 6 FE-7 |
| `/admin/settings` | Profile, hours, rules, notifications, prediction, users, **system control**, data | BO-12, Module 7, Module 8 FE-2…FE-4 |

### Super Admin — Platform Control Centre (`/superadmin`)

A separate console for the platform owner, gated on the `superadmin` role. A
restaurant `admin` who opens it gets an explicit **403** rather than a silent
redirect.

| Route | Screen |
| --- | --- |
| `/superadmin` | Overview — users, restaurants, pending actions, alerts, system snapshot |
| `/superadmin/notifications` | Platform events, read/unread, dismiss |
| `/superadmin/users` | Search, filter, sort, invite, re-role, block (with reason), reset, delete |
| `/superadmin/roles` | Role cards + full permission matrix across all four roles |
| `/superadmin/restaurants` | Directory: approve, reject, suspend, edit, delete, detail view |
| `/superadmin/showcase` | Showcase Manager — order, featured, status, **live carousel preview** |
| `/superadmin/content` | Landing-page CMS — hero, CTAs, showcase copy, announcement bar |
| `/superadmin/system` | Availability, registration, feature flags, data & maintenance |
| `/superadmin/health` | Declared component states + pre-launch checklist |
| `/superadmin/security` | Sessions, sign-in policy, security activity |
| `/superadmin/audit` | Full audit trail with search, filters and pagination |

#### Showcase image guidance

The carousel renders covers in an `aspect-[16/10]` container with
`object-fit: cover`, so the uploader asks for **1600 × 1000 px (16:10), max 2 MB,
JPG/PNG/WebP** — 2× the largest rendered card width. The upload field previews
the file at the real card ratio and warns when the resolution is too low or the
aspect ratio would crop the subject.

#### Scope note

The proposal's LI-1 keeps the *operational* system single-restaurant. The
showcase is therefore **marketing content** — a curated directory of Pakistani
restaurants on the public site — not additional tenants of the reservation
console. `Settings › System Control` (restaurant admin) and
`/superadmin/system` (platform) read and write the same `SystemContext`, so the
shared switches can never drift; the platform page adds registration,
submissions, feature flags and data operations on top.

### Administrator system controls

`Settings › System Control` is administrator-only and takes effect immediately
across the app:

| Control | Effect |
| --- | --- |
| Maintenance mode | Public site (landing, booking, tracker) is replaced by a maintenance notice; the console stays reachable |
| Administrator-only sign-in | Managers and staff are refused at the login screen |
| Read-only mode | Managers and staff can view every module but cannot write |
| Public booking form | Closes `/reserve` without a full maintenance window |
| Guest booking tracker | Closes `/track` |
| Session & password policy | Idle timeout, minimum length, strong-password requirement |
| Danger zone | Block every non-administrator account in one action |

Individual accounts are blocked, unblocked, re-roled or removed from
`Settings › Users & Roles`; a blocked account is refused at the next sign-in.
Maintenance and lockdown switches persist in `localStorage` so a restriction
survives a reload.

Screens with a client mockup: the guest booking page (desktop **and** phone),
Reservations, Table & Time Slot Management, Food Deals, Prediction Dashboard and
Communication. Everything else is derived from those same components and tokens.

## Structure

```
src/
├─ auth/           AuthContext (session, roles) + route guards
├─ store/          ReservationsContext, UsersContext, SystemContext,
│                  PlatformContext (restaurants, flags, CMS, audit, sessions)
├─ components/
│  ├─ layout/      AdminLayout, Sidebar, PageHeader, PublicHeader, BrandLogo
│  ├─ landing/     LandingHeader, ProductPreview, RestaurantShowcase, LandingFooter
│  ├─ superadmin/  SuperAdminLayout, RestaurantFormModal, ImageUploadField
│  ├─ ui/          Button, Card, Badge, Field, DataTable, Pagination, Modal,
│  │               ConfirmDialog, Tabs, Toast, States (empty/error/skeleton)
│  ├─ dashboard/   StatCard (4 mockup variants behind one prop)
│  ├─ charts/      Recharts wrappers + shared chart theme
│  ├─ floorplan/   FloorPlan, table nodes, walls, planters, private room
│  ├─ reservation/ StatusTimeline, ReservationFormModal
│  ├─ table/       TableFormModal, AvailabilityChecker
│  └─ icons/       Glyphs Lucide does not ship (dining table, solid funnel)
├─ data/           All mock datasets — swap these for API calls
└─ pages/
   ├─ public/      Landing, booking, tracker, maintenance, gates, 403, 404
   ├─ auth/        Login, forgot, reset
   ├─ admin/       One file per admin screen (+ settings/SystemControlPanel)
   └─ superadmin/  One file per control-centre screen
```

### Design tokens

Colours were sampled from the mockup images rather than guessed, and live in
[`tailwind.config.js`](tailwind.config.js): brand maroon `#7A1113`, active-nav
red `#C0161A`, gold `#D4A537`, sidebar `#0C0C0E`, page `#F8F6F3`. Layout metrics
are CSS variables in [`src/index.css`](src/index.css). Type is **Figtree**, the
closest widely available match to the sans used in the mockups.

## Replacing the mock data

Screens read from `src/data/*.ts`; live booking state flows through
`ReservationsContext`. To wire a real backend, replace the module-level exports
with data from your fetch layer and swap the context's `create` / `setStatus` /
`update` for API calls — no component changes are needed, because components
only depend on the exported types.

## Backend dependencies

These need a server before they do anything real:

- **Authentication** — passwords are compared client-side against
  `src/data/users.ts`. Replace `AuthContext.signIn` with a real session endpoint.
- **Notifications** — email (SMTP), SMS and WhatsApp sends are queued into a
  toast only. Settings › Notifications marks SMS and WhatsApp as needing API keys.
- **Prediction models** — the footfall, revenue, food and staffing forecasts are
  fixtures. Settings › Prediction & Dashboard exposes the model, training window
  and threshold inputs the Python service would consume.
- **Reports export** — PDF/CSV/XLSX buttons add an entry to the report library;
  actual file generation is server-side.
- **Persistence** — reservations, tables, slots, deals, staff, user accounts,
  showcase restaurants, feature flags, CMS copy and the audit log live in React
  state, so a full page reload resets them to the seed data. Only the
  system-control switches persist (via `localStorage`).
- **Media storage** — uploaded restaurant covers are held as data URLs in
  memory. Wire `POST /admin/media` and store the returned URL instead.
- **Platform endpoints** — every control names the endpoint it would call, e.g.
  `PATCH /admin/users/:id/status`, `DELETE /admin/restaurants/:id`,
  `PATCH /admin/feature-flags/:id`, `POST /admin/system/maintenance`,
  `DELETE /admin/sessions/:id`, `GET /health/*`.
- **Authorisation** — the client hides what a role cannot reach, but a server
  must re-check every permission. Client-side gating is not authorisation.

## Implementation notes

- **Table widths.** The admin tables carry 7–11 columns. They fill the viewport
  from roughly 1700px and scroll horizontally below that rather than shrinking
  text past legibility. Collapsing the sidebar (the ≡ button) buys back ~170px.
- **Table Management KPIs** are computed from the live floor plan, so adding or
  deleting a table moves the numbers. The mockup's static 28/11/12/5 figures are
  therefore replaced by real counts of the 8 tables it draws.
- **Floor plans** are built from CSS/SVG primitives — no image assets were
  supplied. Tables are positioned as percentages so the plan scales.
- **Hero photography.** The guest hero in the mockup uses a restaurant photo.
  None was provided, so the background approximates its lighting. Drop a real
  image in and swap the gradient layer when the asset arrives.
- **No payment screens.** LI-3 excludes the payment gateway from this version,
  so no billing or subscription UI exists.
- **Currency is PKR (₨)** throughout — deals, revenue forecasts, dashboard
  charts and reports. The currency itself is configurable in Settings › Profile.
- **Bundle split.** The public site ships a 170 kB entry chunk; the console and
  the 564 kB charting library load only once a signed-in user opens them.
