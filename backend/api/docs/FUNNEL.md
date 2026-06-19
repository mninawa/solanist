# Lead → Customer Funnel

End-to-end flow from Bark (or manual) lead capture through to a live client portal session.

## Flow diagram

```text
Bark / manual lead
    → POST /webhooks/bark/leads  OR  POST /admin/leads
    → Admin Leads Inbox
    → Send Invite (POST /admin/leads/{id}/invite)
    → Customer opens /invite/{code}
    → Plan → Property → Date → Account (POST /auth/signup)
    → Client dashboard + first booking
```

## Demo walkthrough

### 1. Capture a lead

**Option A — Bark webhook (curl):**

```bash
curl -X POST http://localhost:8080/api/v1/webhooks/bark/leads \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: demo-bark-secret" \
  -d '{
    "customerName": "Amanda Govender",
    "customerEmail": "amanda.demo@email.com",
    "customerPhone": "082 555 9999",
    "propertyAddress": "Waterfall Estate",
    "city": "Midrand",
    "requestSnippet": "Need quarterly solar panel cleaning.",
    "panelCount": 18
  }'
```

**Option B — Admin UI:** Leads Inbox → **+ New Lead** or **Import Bark Emails**

### 2. Send invite

1. Login: `admin@solanist.co.za` (any password)
2. Open the lead → **Send Invite**
3. Click **Send Now** — Mongo creates an `invites` row and sets lead pipeline to `invite_sent`
4. When `WhatsApp__ApiKey` is set, the BFF sends the invite message via **WasenderAPI** to the lead's phone
5. Copy the invite link (`/invite/{CODE}`) if WhatsApp is not configured (local demo)

### WhatsApp (WasenderAPI)

| Variable | Purpose |
|----------|---------|
| `WhatsApp__ApiKey` | WasenderAPI bearer token |
| `Auth__AppBaseUrl` | Full invite URL base (e.g. `https://app.solanist.co.za`) |

Without the API key, **Send Now** still creates the invite — copy the link manually from the admin UI.

### 3. Customer onboarding

**Fresh signup (recommended demo):**

| Step | URL / action |
|------|----------------|
| Open invite | `/invite/PK9M4R` (Peter van Wyk — no existing account) |
| Choose plan | Quarterly Solar Care |
| Confirm property | 14 panels, Metal Roof |
| Pick date | Any available weekday (3+ days ahead) |
| Create account | `peter.vw@email.com` + new password (8+ chars) |

**Already registered (expect 409):**

| Code | Customer | Result |
|------|----------|--------|
| `NB7XK2` | Nicolette Botha | Signup returns email already exists |

### 4. After signup

Mongo creates:

- `customers`, `users`, `properties`, `subscriptions`
- Optional first `bookings` row (when preferred date selected)
- Invite marked `accepted`; linked lead → `converted` / `signed_up`

Customer lands on **Client → Dashboard** with property, subscription, and upcoming booking visible.

## API reference

| Step | Endpoint | Doc |
|------|----------|-----|
| Bark ingest | `POST /webhooks/bark/leads` | [WEBHOOKS.md](./WEBHOOKS.md) |
| Admin leads | `GET/POST /admin/leads` | [ADMIN_API.md](./ADMIN_API.md) |
| Send invite | `POST /admin/leads/{id}/invite` | [ADMIN_API.md](./ADMIN_API.md) |
| Get invite | `GET /invites/{code}` | [INVITE_API.md](./INVITE_API.md) |
| Signup | `POST /auth/signup` | [INVITE_API.md](./INVITE_API.md) |
| Client portal | `GET /client/*` | [CLIENT_API.md](./CLIENT_API.md) |

## Signup error codes

Returned in API `message` on 400/409:

| Code | Meaning |
|------|---------|
| `email_exists` | Email already registered (409) |
| `invalid_invite` | Code not found |
| `invite_used` | Invite already accepted |
| `expired_invite` | Past expiry date |
| `invalid_plan` | Plan id not on invite |
| `invalid_request` | Missing email/password |

## Mongo collections

| Collection | Funnel role |
|------------|-------------|
| `leads` | Inbox + pipeline + `inviteCode` / `leadId` link |
| `invites` | Quote, plans, property snapshot, expiry |
| `customers` / `users` | Created on signup |
| `properties` / `subscriptions` | Plan + panel details |
| `bookings` | First clean from preferred date |
