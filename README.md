# SmartDine Optimizer — Asian Wok

A **plug-and-play restaurant reservation and ML-based predictive operations
management system**: a React front end and an Express + Prisma API, covering the
eight modules in the project proposal.

Two sources drive this codebase:

- **`FYP proposal.pdf`** — the product requirements (modules, features, roles,
  objectives). It decides *what* exists.
- **`mockupimg/`** — the client's screen designs. They decide *how* the seven
  mocked screens look; those are reproduced rather than reinterpreted.

## Running it

First run — installs both packages, creates the SQLite database and seeds it:

```bash
npm run setup
```

Then start the API and the web app together:

```bash
npm run dev
```

- Web app — http://localhost:5199
- API — http://localhost:4000/api

`npm run build` produces a production bundle. `npm run lint` type-checks the
client and the server. `npm run db:reset` drops the database and re-seeds it,
which is the quickest way back to a known demo state.

The client points at `http://localhost:4000/api` by default; set `VITE_API_URL`
to change it. Server configuration lives in `server/.env` (copy
`server/.env.example`), which is gitignored because it holds the JWT secret.

> The API reads `API_PORT`, not `PORT`. When both servers start together the
> tooling sets `PORT` for Vite, and an API honouring it would bind to the web
> server's port.

### Demo accounts

| Role | Email | Password | Sees |
| --- | --- | --- | --- |
| Super Admin | `super@asianwok.pk` | `super123` | Everything, plus the Control Centre |
| Administrator | `admin@asianwok.pk` | `admin123` | The restaurant console |
| Manager | `manager@asianwok.pk` | `manager123` | All modules, read-only settings |
| Staff | `floor@asianwok.pk` | `staff123` | Reservations, tables, slots, deals, staff, communication |

Passwords are bcrypt-hashed in the database; these are seed values for local
development only. Sign-in issues a JWT bound to a `Session` row, so blocking an
account or revoking a session takes effect on the next request rather than at
token expiry.

## Routes

### Public site
| Route | Screen | Requirement |
| --- | --- | --- |
| `/` | Home — live availability, the real floor plan, set menus, FAQ | Proposal overview |
| `/reserve` | Reserve Your Table (+ floor plan, seating preference, success state) | Module 1 FE-1…FE-5, BO-2 |
| `/track` | Track Your Reservation — status + history by reference | Module 1 FE-6 |

#### The home page starts the booking; `/reserve` finishes it

The hero carries a **booking starter**: four quick dates, the restaurant's own
time slots and a party stepper, all bounded by the live reservation rules. It
queries `/public/availability` as you change them and answers honestly —
*"4 of 28 tables free for 8 guests at 6:00 PM"* — then hands the three answers
to `/reserve` as query parameters so nothing is typed twice.

The booking page treats that handoff as a *suggestion*: each value is used only
if it is genuinely on offer, so a stale bookmark or a hand-edited URL falls back
to safe defaults rather than seeding something the server would reject.

Below it, **the room preview renders the same `FloorPlan` the console and the
booking page use**, fed by the same endpoint — so the green tables really are
the ones free *and* large enough for your party at the time chosen above.
Changing the party size in the hero redraws the floor plan. It is deliberately
not selectable: choosing a table is a booking decision and belongs on the page
that captures the guest's details in the same step.

Everything else on the page is read from the database too — the fact strip
(tables, sittings, party limit, booking window), the set menus and their prices,
and the opening hours. Nothing on it is a marketing figure.

There is no public sign-up: the proposal provisions accounts by invitation
(Module 8 FE-2), so the CTAs point at `/reserve` for guests and `/login` for
staff.

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
| `/superadmin` | Overview — users, sessions, pending actions, alerts, system snapshot |
| `/superadmin/notifications` | Platform events, read/unread, dismiss |
| `/superadmin/users` | Search, filter, sort, invite, re-role, block (with reason), reset, delete |
| `/superadmin/roles` | Role cards + full permission matrix across all four roles |
| `/superadmin/content` | Landing-page CMS — hero copy, closing panel, announcement bar |
| `/superadmin/system` | Availability, registration, feature flags, data & maintenance |
| `/superadmin/health` | Declared component states + pre-launch checklist |
| `/superadmin/security` | Sessions, sign-in policy, security activity |
| `/superadmin/audit` | Full audit trail with search, filters and pagination |

#### Scope note

The proposal's LI-1 keeps the system single-restaurant, and the build now holds
to that everywhere: there is no directory of other restaurants and no notion of
additional tenants. `Settings › System Control` (restaurant admin) and
`/superadmin/system` (platform) read and write the same `SystemContext`, so the
shared switches can never drift; the platform page adds registration, feature
flags and data operations on top.

#### What the Landing Page CMS may edit

Only copy the public page actually renders: the hero's second headline line and
its supporting paragraph, the closing panel, and the announcement bar. The
restaurant name, the cuisine-and-city badge and the button labels are derived
from real data — the buttons change themselves with live availability — so they
are deliberately not editable. A CMS field that saves successfully and changes
nothing on the page is worse than no field at all.

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
│  ├─ landing/     LandingHeader, Hero, BookingStarter, RoomPreview,
│  │               LandingFooter, Reveal, primitives
│  ├─ superadmin/  SuperAdminLayout, RestaurantFormModal, ImageUploadField
│  ├─ ui/          Button, Card, Badge, Field, DataTable, Pagination, Modal,
│  │               ConfirmDialog, Tabs, Toast, States (empty/error/skeleton)
│  ├─ dashboard/   StatCard (4 mockup variants behind one prop)
│  ├─ charts/      Recharts wrappers + shared chart theme
│  ├─ floorplan/   FloorPlan, table nodes, walls, planters, private room
│  ├─ reservation/ StatusTimeline, ReservationFormModal
│  ├─ table/       TableFormModal, AvailabilityChecker
│  └─ icons/       Glyphs Lucide does not ship (dining table, solid funnel)
├─ data/           Shared types, option lists and the seed fixtures. The
│                  screens read the API; the seed imports these so the
│                  database and the UI agree by construction.
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

## Backend

`server/` is an Express + TypeScript API using Prisma. It is the single source
of truth: the client holds no business rules, and every permission the console
hides is re-checked on the server.

```
server/
  prisma/schema.prisma   19 models covering all eight proposal modules
  prisma/seed.ts         seeds from the same src/data fixtures the UI shipped
  src/index.ts           app wiring, CORS, error handling
  src/lib/               auth, permissions, reservations, settings, mail, audit
  src/middleware/        session loading, permission gates, read-only guard
  src/routes/            one router per module
```

### Database

SQLite by default, so the project runs with no external service. The proposal
names MySQL 8, and switching is a two-line change — set `provider = "mysql"` in
`schema.prisma`, point `DATABASE_URL` at the server, then `npm run db:push`. No
model uses a SQLite-only feature.

Double-booking is prevented by the database itself rather than by application
code, via a unique index on `(tableCode, date, timeSlot, activeHold)`. Live
bookings carry `activeHold = "held"`; cancelled, rejected and completed ones set
it to `NULL`, which releases the table (Module 3 FE-5).

Money is stored as integer paisa, never a float.

### API surface

| Area | Routes |
| --- | --- |
| Auth | `POST /auth/login`, `/logout`, `/forgot-password`, `/reset-password`, `/change-password`; `GET /auth/me`, `/auth/sessions` |
| Public (Module 1) | `GET /public/config`, `/public/availability`, `/public/reservations/:ref`; `POST /public/reservations`, `/public/reservations/:ref/cancel`, `/public/feedback` |
| Reservations (Module 2) | `GET /reservations`, `/stats`, `/upcoming`, `/:id`; `POST /`, `/:id/status`, `/bulk-status`, `/:id/resend`; `PATCH /:id` |
| Tables (Module 3) | `GET /tables`, `/stats`, `/availability`; `POST /`; `PATCH /:id`, `/:id/position`; `DELETE /:id` |
| Time slots (Module 3) | `GET /time-slots`; `POST /`; `PATCH /:id`; `DELETE /:id` |
| Deals (Module 4) | `GET /deals`, `/stats`, `/performance`; `POST /`; `PATCH /:id`; `DELETE /:id` |
| Special requests (Module 4) | `GET /special-requests`, `/alerts`; `PATCH /:id` |
| Staff (Module 4) | `GET /staff`, `/allocation`, `/stats`; `POST /`; `PATCH /:id`; `DELETE /:id` |
| Predictions (Module 5) | `GET /predictions`, `/summary`, `/:kind/history`; `POST /predictions/ingest` |
| Dashboard (Module 6) | `GET /dashboard`, `/footfall`, `/peak-hours`, `/alerts` |
| Reports (Module 6) | `GET /reports`, `/reports/export`, `/reports/history` |
| Settings (Modules 3, 5, 7) | `GET /settings`, `/settings/data-summary`; `PUT /settings/profile`, `/hours`, `/rules`, `/prediction` |
| Notifications (Module 8) | `GET /notifications`, `/stats`, `/activity`, `/templates`, `/settings`; `POST /send`, `/:id/resend`; `PUT /settings`; `PATCH /templates/:id` |
| Users (Module 8) | `GET /users`, `/users/roles`; `POST /`, `/:id/status`, `/:id/invite`, `/:id/revoke-sessions`; `PATCH /:id`; `DELETE /:id` |
| Platform | `GET/POST/PATCH/DELETE /platform/features`, `/content`, `/system`, `/audit`, `/notifications`, `/sessions`, `/health`, `/overview` |

### What the numbers are computed from

Nothing on a screen is a hard-coded figure any more:

- **Dashboard KPIs and the revenue trend** aggregate `DailyMetric` rows.
- **Peak-hour load** is live bookings against the smaller of table capacity and
  the slot's `maxReservations`.
- **Operational alerts** are derived conditions — a slot crossing 70% or 90%,
  a blocked table, requests awaiting approval — not a fixed list.
- **Reports** aggregate the daily series, so weekly and monthly totals always
  reconcile with the daily rows they came from.
- **Staff allocation** divides guests held per shift by the guests-per-chef and
  guests-per-server ratios set in Settings.
- **Deal performance** counts bookings whose *occasion* matches each deal. A
  booking does not record which deal a guest chose, so "how often was this deal
  selected" is not answerable from the data, and the screen says so instead of
  inventing it.

## Security

Deployment and hardening are covered in [DEPLOYMENT.md](DEPLOYMENT.md). In
short:

- The API **refuses to start** in production with a weak or placeholder
  `JWT_SECRET`, a wildcard `CLIENT_ORIGIN`, or a plain-HTTP origin.
- Accounts lock for 15 minutes after 5 failed sign-ins, and any one source is
  capped at 40 failed attempts per 15 minutes so password spraying across many
  accounts is caught too.
- Sign-in never reveals whether an address is registered — same message, and a
  bcrypt comparison runs even for a missing account so the timing matches.
- Sessions are rows in the database, not just signed tokens, so blocking a user
  or revoking a session takes effect on the next request. Idle sessions are
  revoked after the configured timeout.
- Helmet sets `default-src 'none'`, `frame-ancestors 'none'`, `nosniff`,
  `no-referrer`, and HSTS in production.
- The sign-in screen's demo-account panel is gated by the *server*, and is
  refused outright in production.
- The seed refuses to run against a production database.

## Background jobs

A single timer in `server/src/lib/scheduler.ts` runs three jobs every minute.
Each re-reads its settings on every pass, so a change in the console takes
effect without a restart:

- **Reminders** (M8 FE-5) — sends a reminder the configured number of hours
  before a booking. Sent once per booking; the notification log is the record,
  so a restart cannot double-send.
- **Expired holds** (M3 FE-5) — a pending request older than `holdMinutes`
  releases its table and the guest is told, which is what the booking page's
  "held for 10 minutes" notice promises.
- **No-show close-out** — confirmed bookings are completed once their slot has
  passed, releasing the table and clearing the live worklist.

Set `RUN_SCHEDULER=false` on every instance but one when running more than one.

## Still outstanding

- **Prediction models.** Module 5 FE-7 — storing and serving forecasts — is
  implemented: `PredictionOutput` holds them and `POST /predictions/ingest` is
  the contract a training service writes to. The models themselves are not
  trained; seeded rows are marked `model: "seed"` and the Prediction screen
  shows a banner saying the figures are reference data, not a forecast.
- **SMS and WhatsApp.** No gateway credentials exist, so those channels are
  logged with the reason recorded, never sent. All five templates default to
  Email, which is the only channel with a real transport.
- **PDF export.** CSV is generated server-side. PDF uses the browser's own
  print-to-PDF against a print stylesheet.
- **Automated tests.** Behaviour has been verified by driving the running
  system; there is no regression suite.

## Implementation notes

- **Table widths.** The admin tables carry 7–11 columns. They fill the viewport
  from roughly 1700px and scroll horizontally below that rather than shrinking
  text past legibility. Collapsing the sidebar (the ≡ button) buys back ~170px.
- **The floor plan shows all 28 tables.** The Table Management mockup drew eight
  tables while its own KPI row read "28". The database holds all 28, grouped
  into section bands, and both the admin plan and the guest booking plan render
  those rows — so a guest can only ever pick a table that exists. Table KPIs are
  counted server-side across every table, not just the visible filter.
- **Floor plans** are built from CSS/SVG primitives — no image assets were
  supplied. Tables are positioned as percentages so the plan scales.
- **Hero photography.** The guest hero in the mockup uses a restaurant photo.
  None was provided, so the background approximates its lighting. Drop a real
  image in and swap the gradient layer when the asset arrives.
- **Guest table availability is live.** The booking plan asks the API which
  tables are free for the chosen date and slot, and clears the selection if that
  table stops being available. Bookable dates are generated from today against
  the `advanceDays` rule, so the form cannot offer a date the server rejects.
- **No payment screens.** LI-3 excludes the payment gateway from this version,
  so no billing or subscription UI exists.
- **Currency is PKR (₨)** throughout — deals, revenue forecasts, dashboard
  charts and reports. The currency itself is configurable in Settings › Profile.
- **Bundle split.** The public site ships a 215 kB entry chunk (61 kB gzipped);
  the console and the 564 kB charting library load only once a signed-in user
  opens them.
