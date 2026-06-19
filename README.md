# Solanist

Monorepo for the Solanist solar care platform.

| Folder | Description |
|--------|-------------|
| [`external-client/`](external-client/) | Customer, staff & admin Angular app |
| [`backend/api/`](backend/api/) | C# API — Clean Architecture + External BFF |

## Quick start (Docker)

**Always deploy via Docker** after building — from the repo root:

```bash
npm run deploy          # build images + start containers in background
# or
docker compose up --build -d
```

| Command | Description |
|---------|-------------|
| `npm run deploy` | Build and start all services (recommended after changes) |
| `npm run up` | Build and start with logs in foreground |
| `npm run down` | Stop containers |
| `npm run logs` | Tail container logs |
| `./scripts/deploy.sh` | Same as `npm run deploy` |

| Service | URL |
|---------|-----|
| External client app | http://localhost:8080 |
| BFF External API | http://localhost:8081/api/v1/health |

Local Angular dev (without Docker): `cd external-client && npm start`

## Demo logins

Any password works in demo mode:

| Role | Email |
|------|-------|
| Admin | `admin@solanist.co.za` |
| Staff | `james.staff@solanist.co.za` |
| Client | `nicolette.botha@email.com` |

## Architecture

```text
external-client (Angular, mockMode: false in Docker)
        ↓  /api/v1/*
Solanist.Bff.External (C#)
        ↓
Solanist.Application → Solanist.Domain
        ↓
Solanist.Infrastructure
   ├── MongoDB (leads, customers, bookings, jobs, …)
   └── Mock fallback when Mongo__ConnectionString is empty
```

Set `MONGODB_CONNECTION_STRING` in a root `.env` file for live Mongo data. Without it, the BFF uses in-memory mock services.

## API docs

| Doc | Area |
|-----|------|
| [FUNNEL.md](backend/api/docs/FUNNEL.md) | Lead → customer onboarding (end-to-end) |
| [STAFF_FIELD_OPS.md](backend/api/docs/STAFF_FIELD_OPS.md) | Staff field workflow (check-in → report) |
| [ADMIN_API.md](backend/api/docs/ADMIN_API.md) | Admin portal |
| [CLIENT_API.md](backend/api/docs/CLIENT_API.md) | Client portal |
| [STAFF_API.md](backend/api/docs/STAFF_API.md) | Staff jobs & schedule |
| [INVITE_API.md](backend/api/docs/INVITE_API.md) | Invite & signup |
| [AUTH.md](backend/api/docs/AUTH.md) | Google Sign-In & password auth |
| [WEBHOOKS.md](backend/api/docs/WEBHOOKS.md) | Bark webhook + Zapier |

## Production deploy

See [docs/RENDER.md](docs/RENDER.md) for Render Blueprint setup (Starter instances, MongoDB Atlas, `render.yaml`).

**CI/CD:** GitHub Actions builds on every PR/push ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)); Render auto-deploys `main` when the repo is connected.

After deploy, run smoke tests:

```bash
npm run smoke                                    # local Docker
SMOKE_BASE_URL=https://your-app.onrender.com npm run smoke   # production
```

Full checklist: [docs/PRODUCTION.md](docs/PRODUCTION.md).
