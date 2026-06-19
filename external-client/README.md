# Solanist — External Client App

Customer-facing and staff-facing Angular web application for solar panel cleaning services.

Three experiences in one deployable frontend:

- **Public invite** — leads open a WhatsApp invite link, review quote, select a plan, and create an account
- **Client portal** — customers manage property, bookings, reports, and subscription
- **Staff portal** — technicians execute assigned cleaning jobs on-site

## Quick Start

From the repo root:

```bash
cd external-client
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200)

## Demo Flow

### Invite → Client conversion

1. Open `/invite/NB7XK2`
2. Review Nicolette Botha's quote → **View My Quote & Plans**
3. Select **Quarterly Solar Care** (R499/clean)
4. Confirm property details → choose date & time → create account
5. Land on `/client/dashboard`

### Staff job execution

1. Sign in as staff: `james.staff@solanist.co.za` (any password)
2. Complete job flow: Check In → Photos → Checklist → Complete
3. Sign back in as client to view report at `/client/reports`

## Admin portal

Sign in as `admin@solanist.co.za` (any password) → `/admin/dashboard`

## Data & API

Docker deploy (`npm run deploy` from repo root) sets `mockMode: false` — the app calls the BFF at `/api/v1/*` with JWT auth.

| Mode | Config | Data source |
|------|--------|-------------|
| Live (Docker / Render) | `mockMode: false` in `app-config.ts` | MongoDB via BFF |
| Local dev offline | `mockMode: true` | `src/app/core/data/*.ts` |

Services with live API wiring: auth, invites, client, staff, admin.

## Build

```bash
npm run build
```

Output: `dist/external-client`

## Docker

Production image uses a multi-stage build (Node → nginx).

From the repo root:

```bash
docker compose up --build
```

Or from `external-client/`:

```bash
npm run docker:build
npm run docker:run
```

App is served at [http://localhost:8080](http://localhost:8080) by default. Override the port with `EXTERNAL_CLIENT_PORT` in a `.env` file at the repo root.
