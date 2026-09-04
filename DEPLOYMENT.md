# Deploying SmartDine Optimizer

The API refuses to start in production if any of the checks in this document
fail, so a misconfigured deployment stops loudly rather than running insecurely.

---

## 1. Generate a secret

```bash
npm --prefix server run gen:secret
```

Put the value in your host's secret manager as `JWT_SECRET`. Never commit it.

The server rejects a secret that is under 32 characters or that contains
`change-me`, `dev-secret`, `secret`, `password` or `changeme`.

Rotating this secret signs everyone out — that is the intended way to force a
global sign-out after a suspected compromise.

## 2. Move to MySQL

SQLite is the development default. For production, in `server/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

Then:

```bash
DATABASE_URL="mysql://user:pass@host:3306/smartdine" npm --prefix server run db:push
```

Use a database account limited to `SELECT, INSERT, UPDATE, DELETE` on that one
schema — the application never needs `DROP` or `GRANT` at runtime.

> Do **not** run `db:seed` against a live database. It deletes every row and
> creates demo accounts with known passwords. It refuses to run when
> `NODE_ENV=production` unless `ALLOW_PRODUCTION_SEED=true` is set.

## 3. Environment

Copy `server/.env.example`. The production-critical values:

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | yes | Must be `production` — it enables HSTS, secure cookies and every config check |
| `JWT_SECRET` | yes | From step 1 |
| `DATABASE_URL` | yes | MySQL connection string |
| `CLIENT_ORIGIN` | yes | Exact HTTPS origin(s), comma-separated. Cannot be `*` |
| `FORCE_HTTPS` | recommended | `true` when behind a terminating proxy |
| `SMTP_HOST/PORT/USER/PASS` | for email | Without these, messages are logged but never delivered |
| `RUN_SCHEDULER` | if scaling | `true` on exactly one instance, `false` on the rest |
| `MAX_LOGIN_ATTEMPTS` | optional | Default 5 |
| `LOCKOUT_MINUTES` | optional | Default 15 |

`SHOW_DEMO_ACCOUNTS` is ignored in production — the sign-in screen never lists
credentials on a live deployment.

## 4. Create the first administrator

The seed's demo accounts must not exist in production. Create a real super
admin instead:

```bash
node --input-type=module -e "
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()
await prisma.user.create({
  data: {
    name: 'Your Name',
    email: 'you@restaurant.pk',
    phone: '+92 300 0000000',
    passwordHash: await bcrypt.hash(process.env.INITIAL_PASSWORD, 12),
    role: 'superadmin',
    status: 'Active',
  },
})
await prisma.\$disconnect()
"
```

Run it with `INITIAL_PASSWORD` set in the shell, change the password after the
first sign-in, then invite everyone else from Settings → Users. Invited users
set their own password; no administrator ever sees it.

## 5. Build and run

```bash
npm run build                 # front end → dist/
npm --prefix server run build # API → server/dist/
NODE_ENV=production npm --prefix server start
```

Serve `dist/` as static files from your web server or CDN, and reverse-proxy
`/api` to the Node process. Set `VITE_API_URL` at build time if the API is on a
different origin from the front end.

Run the API under a supervisor (systemd, PM2, or your platform's process
manager). It handles `SIGTERM` by draining in-flight requests before exiting.

## 6. Proxy configuration

The app sets `trust proxy` to `1`, meaning it trusts exactly one hop. Your proxy
must set `X-Forwarded-For` and `X-Forwarded-Proto`, and must not pass through
client-supplied values for those headers — otherwise rate limiting can be
bypassed by spoofing an address.

---

## What is protected, and how

| Risk | Control |
| --- | --- |
| Password guessing | Account locks for 15 min after 5 failures; the lock is checked before the password is compared |
| Password spraying | 40 failed auth attempts per source per 15 min, on top of the per-account limit |
| Account enumeration | Sign-in and password reset return the same response whether or not the address exists, and a missing account still runs a bcrypt comparison so timing does not reveal it |
| Session theft | Tokens are bound to a `Session` row, so revoking a session or blocking a user takes effect on the next request rather than at token expiry |
| Unattended console | Idle sessions are revoked after `sessionTimeoutMinutes` (default 60) |
| Privilege escalation | Every route re-checks the permission server-side; the client only hides controls |
| Last-admin lockout | The system refuses to demote, block or delete the final active super admin |
| Booking spam | 12 public bookings per source per hour |
| Cross-site requests | CORS is restricted to declared origins; a wildcard is refused because the API sends credentials |
| Clickjacking / injection | `frame-ancestors 'none'`, `default-src 'none'`, `nosniff`, `no-referrer` |
| Downgrade to HTTP | HSTS for one year with preload, plus an optional 308 redirect |
| Credential leakage | Passwords are bcrypt-hashed and never returned by any endpoint; reset tokens are stored hashed; the health screen reports whether a credential is configured, never its value |
| Data tampering | Every state-changing action is written to an append-only audit trail |

## Known limitations

These are deliberate and documented rather than overlooked:

- **Rate limits are per-process, held in memory.** Running several instances
  multiplies the effective limit. Move to a shared store (Redis) when scaling
  horizontally.
- **Prediction models are not trained.** Forecasts are stored reference data,
  marked `model: "seed"` and labelled as such in the UI. `POST
  /api/predictions/ingest` is the contract for a real training service.
- **SMS and WhatsApp have no gateway.** Those templates are logged, never sent.
  All five message templates default to Email for that reason.
- **Uploaded showcase images are stored inline** in the database as data URLs.
  Move to object storage before handling real volume.
- **PDF export uses the browser's print dialog.** CSV is generated server-side.
- **No automated test suite.** Behaviour has been verified by driving the
  running system, not by regression tests.

## Pre-launch checklist

- [ ] `JWT_SECRET` generated and stored in a secret manager
- [ ] `NODE_ENV=production`
- [ ] Database moved off SQLite, with a least-privilege account
- [ ] `CLIENT_ORIGIN` set to the real HTTPS origin
- [ ] Demo accounts absent; a real super admin created
- [ ] SMTP configured and a test email received
- [ ] TLS terminating in front of the API, `FORCE_HTTPS=true`
- [ ] Database backups scheduled **and a restore tested**
- [ ] `RUN_SCHEDULER` set on exactly one instance
- [ ] Log aggregation in place for `[unhandled]` and `[scheduler]` entries
