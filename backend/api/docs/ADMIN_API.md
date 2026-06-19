# Admin API (`/api/v1/admin`)

Requires JWT with `admin` role. Send `Authorization: Bearer <token>`.

Admin user: `admin@solanist.co.za` (any password in demo).

## Read

| Method | Path | Response |
|--------|------|----------|
| GET | `/dashboard` | Ops dashboard (stats, funnel, today jobs across all staff) |
| GET | `/inbox-stats` | Lead inbox KPIs + sidebar widgets (hotspots, suggested steps, top score) |
| GET | `/search?q=` | Search leads and customers by name, email, phone, location |
| GET | `/leads` | All leads — optional query `?status=` and `?urgency=` |
| GET | `/leads/{id}` | Single lead |
| GET | `/bookings` | All bookings with customer names — **Admin → Bookings** (staff assignment) |
| GET | `/customers` | Customers + property counts |
| GET | `/staff` | Staff users + today job counts (also **Admin → Staff** page) |
| GET | `/jobs` | All staff jobs scheduled for today — **Admin → Jobs** (route board) |
| GET | `/issues` | Open field issues on today's jobs (access, safety, etc.) |
| GET | `/reports` | All cleaning reports |
| GET | `/subscriptions/stats` | Subscription KPIs |
| GET | `/subscriptions` | Active subscription rows |
| GET | `/subscriptions/plans` | Plan catalogue (Mongo `service_plans`) |
| GET | `/settings` | Portal config (environment, integrations, counts) |
| GET | `/schedule` | Today's jobs grouped by area + staff load |
| GET | `/invites` | Sent invites from Mongo (`invites` collection) — **Admin → Invites** page |

## Mutations

| Method | Path | Body | Notes |
|--------|------|------|-------|
| PATCH | `/leads/{id}` | `UpdateLeadContactRequest` | Update contact fields (logs activity) |
| PATCH | `/leads/{id}/status` | `{ status }` | Update lead status (sets pipeline to `signed_up` when converted; logs activity) |
| PATCH | `/leads/{id}/pipeline` | `{ pipelineStage }` | Update CRM pipeline stage (sets status to `converted` when `signed_up`) |
| POST | `/leads/{id}/tags` | `{ label, tone? }` | Add tag (`teal`, `gold`, `red`, `purple`, `blue`) |
| POST | `/leads/{id}/notes` | `{ note }` | Append conversation note + activity |
| POST | `/leads/{id}/invite` | `{ expiryDays?, sentBy? }` | Create invite in Mongo, update lead |
| POST | `/leads` | `CreateLeadRequest` | Manually add a lead |
| POST | `/leads/sync-bark` | — | Simulate Bark email import (creates a demo lead) |
| PATCH | `/bookings/{id}/assign` | `{ staffId, staffName }` | Assign staff to booking (+ linked staff job) |
| POST | `/subscriptions/plans` | `UpsertServicePlanRequest` | Create service plan |
| PATCH | `/subscriptions/plans/{id}` | `UpsertServicePlanRequest` | Update service plan |
| DELETE | `/subscriptions/plans/{id}` | — | Deactivate plan (soft delete) |
| POST | `/subscriptions/plans/{id}/paystack-sync` | — | Create Paystack plan and store `PLN_*` code |

## Data sources

| Feature | Mongo collection | Notes |
|---------|------------------|-------|
| Leads | `leads` | Seeded on first run from demo inbox |
| Bookings | `bookings` | Includes `staffId` / `staffName` |
| Customers | `customers`, `properties` | Joined for admin list |
| Staff | `users` (`role: staff`) | Job counts from `staff_jobs` |
| Jobs | `staff_jobs` | All staff, not scoped to one technician |
| Reports | `reports` | All customers |
| Subscriptions | `properties`, `subscriptions` | Rows built from active properties |

Dashboard KPIs, funnel, **Gauteng hotspot map** (live lead density by city), revenue chart, and Bark requests are computed from Mongo (`leads`, `payments`, `bookings`, `properties`). Demo payment rows (`pay-dash-*`) roll forward on BFF startup for a live revenue trend.

Bark email ingestion: see [WEBHOOKS.md](./WEBHOOKS.md).

## Angular

When `APP_CONFIG.mockMode` is `false`, `AdminService` calls these endpoints. Set `mockMode: false` in `app-config.ts` (default for Docker deploy).
