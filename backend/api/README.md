# Solanist Backend API

C# solution following Clean Architecture with a dedicated External BFF for the Angular app.

## Structure

```text
backend/api/
├── src/
│   ├── Solanist.Application      # Use cases & abstractions
│   ├── Solanist.Bff.External     # External-client BFF ✓
│   ├── Solanist.Bff.Shared       # Shared BFF utilities
│   ├── Solanist.Domain           # Domain enums & entities
│   └── Solanist.Infrastructure   # MongoDB + mock fallback
├── docs/                         # API reference
└── Solanist.sln
```

Stub projects (`Solanist.Bff.Admin`, `Solanist.Bff.Client`, `Solanist.Api`) exist for future split BFFs; all live routes are on **Solanist.Bff.External** today.

## Run locally

```bash
cd backend/api
dotnet run --project src/Solanist.Bff.External
```

Default: **http://localhost:8080** (see `launchSettings.json`).

With MongoDB:

```bash
Mongo__ConnectionString="mongodb://..." dotnet run --project src/Solanist.Bff.External
```

## API (External BFF)

Base path: `/api/v1`

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/login`, `POST /auth/signup` |
| Invites | `GET /invites/{code}` |
| Client | `GET /client/dashboard`, `/bookings`, `/reports`, `/subscription`, … |
| Staff | `GET /staff/dashboard`, `/jobs`, `/schedule`, `POST /jobs/{id}/check-in`, … |
| Admin | `GET /admin/dashboard`, `/leads`, `/customers`, `/schedule`, `/search`, … |
| Webhooks | `POST /webhooks/bark/leads` (header `X-Webhook-Secret`) |

All responses use `{ "data": ..., "message": null }`.

Full reference: [`docs/`](docs/)

## Persistence

When `Mongo__ConnectionString` is set:

- Collections seeded on startup (`leads`, `customers`, `bookings`, `staff_jobs`, …)
- Maintenance upserts refresh demo rows (dashboard payments, extra leads, etc.)

When Mongo is **not** configured, `Infrastructure/Mock/*` services mirror the same DTOs in memory.

## Docker

From repo root:

```bash
docker compose up --build
```

- **external-client** → http://localhost:8080 (nginx proxies `/api/` to BFF)
- **bff-external** → http://localhost:8081 (direct API access)

Environment (`.env` at repo root):

| Variable | Purpose |
|----------|---------|
| `MONGODB_CONNECTION_STRING` | Atlas or local Mongo URI |
| `BARK_WEBHOOK_SECRET` | Bark/Zapier webhook auth |

## Integrations

- **Bark leads:** [`docs/WEBHOOKS.md`](docs/WEBHOOKS.md) — direct POST or Bark → Zapier → webhook
- **Render:** [`../../docs/RENDER.md`](../../docs/RENDER.md)
