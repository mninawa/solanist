# Invite & Signup API

Public endpoints for the customer onboarding funnel (no auth required).

## Get invite

| Method | Path | Response |
|--------|------|----------|
| GET | `/api/v1/invites/{code}` | `InviteDto` |

Returns quote, property, plans, expiry, and `status` (`pending` | `accepted` | `expired`). Expired pending invites are marked `expired` on read.

The invite app checks `status` and `signupBlockedReason` on load. Onboarding only starts when `status` is `pending` and `signupBlockedReason` is null. Otherwise a blocking screen is shown (login for `email_exists` / `invite_used`, contact for `expired_invite`).

### Demo codes

| Code | Customer | Notes |
|------|----------|-------|
| `NB7XK2` | Nicolette Botha | Existing account — `signupBlockedReason: email_exists` on GET |
| `PK9M4R` | Peter van Wyk | Use for full signup flow |

Login page links to `/invite/NB7XK2`.

## Signup

| Method | Path | Body |
|--------|------|------|
| POST | `/api/v1/auth/signup` | `SignupRequestDto` |

Creates `customers`, `properties`, `users`, `subscriptions`, and optional first `booking` from the invite.

Also marks the invite `accepted` and updates the linked lead to `converted` / `signed_up`.

Error responses include `{ "data": null, "message": "<error_code>" }` — see [FUNNEL.md](./FUNNEL.md).

### Request body

```json
{
  "email": "peter.vw@email.com",
  "password": "password123",
  "firstName": "Peter",
  "lastName": "van Wyk",
  "phone": "084 333 4455",
  "inviteCode": "PK9M4R",
  "selectedPlanId": "plan-quarterly",
  "preferredServiceDate": "2026-06-25",
  "preferredTimeSlot": "morning",
  "panelCount": 14,
  "roofType": "Metal Roof",
  "accessNotes": "Front gate code: 7721"
}
```

### Responses

| Status | Meaning |
|--------|---------|
| 200 | JWT session returned (same shape as login) |
| 400 | Invalid / expired / used invite |
| 409 | Email already registered |

## MongoDB

- Collection: `invites` — seeded on first BFF boot
- Linked to `leads` via `leadId` on invite document

## Angular

- `InviteService` → `GET /invites/{code}` when `mockMode: false`
- `AuthService.signup()` → `POST /auth/signup`
- Onboarding: `/invite/:inviteCode`
