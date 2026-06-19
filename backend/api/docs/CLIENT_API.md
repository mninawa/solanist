# Client API (`/api/v1/client`)

All responses use envelope: `{ "data": <payload>, "message": null }`.

**Authentication required** — obtain a JWT via `POST /api/v1/auth/login`, then send `Authorization: Bearer <token>`.

Demo client: `nicolette.botha@email.com` → customer `cust-001` (any password for demo users).

## Auth

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/v1/auth/login` | `{ email, password }` | `{ user, token }` |
| POST | `/api/v1/auth/forgot-password` | `{ email }` | `{ accepted, devResetUrl? }` — always returns `accepted: true`; sends reset email via **Postmark** when `Email__PostmarkServerToken` + `Email__FromAddress` are set; `devResetUrl` only when email was not sent and `Auth:ExposeResetLinks` is enabled (local/demo) |
| POST | `/api/v1/auth/reset-password` | `{ token, newPassword, confirmPassword }` | `{ success }` or 400 with error code |

JWT claims: `sub`, `email`, `role`, `customer_id` (clients), `staff_id` (staff).

## Read

| Method | Path | Response |
|--------|------|----------|
| GET | `/dashboard` | `ClientDashboard` |
| GET | `/bookings` | `Booking[]` |
| GET | `/bookings/{id}` | `Booking` |
| GET | `/properties/{propertyId}/bookings/upcoming` | `Booking \| null` |
| GET | `/reports` | `CleaningReport[]` |
| GET | `/reports/{id}` | `CleaningReport` |
| GET | `/subscription` | `Subscription` |
| GET | `/subscription/portfolio` | `{ properties, portfolio, payments }` |
| GET | `/payments` | `Payment[]` |
| GET | `/properties` | `PropertySummary[]` |
| GET | `/properties/{id}/plan` | `PropertyPlanDetails` |
| GET | `/profile` | `ClientProfile` |

## Write

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/bookings` | `CreateBookingRequest` | `Booking` |
| PATCH | `/bookings/reschedule` | `RescheduleBookingRequest` | `Booking` |
| PATCH | `/subscription/billing-mode` | `{ billingMode }` | `string` |
| PATCH | `/profile` | `UpdateClientProfileRequest` | `ClientProfile` |
| POST | `/profile/change-password` | `{ currentPassword?, newPassword, confirmPassword }` | `{ success }` |
| GET | `/paystack/config` | — | Paystack public key + enabled flag |
| POST | `/paystack/initialize` | `{ propertyId?, planName? }` | Start Paystack checkout |
| POST | `/paystack/verify` | `{ reference }` | Confirm payment |
| POST | `/paystack/cancel` | — | Cancel Paystack subscription |
| POST | `/properties` | `CreatePropertyRequest` | `PropertySummary` |
| PATCH | `/properties/{id}/primary` | — | `PropertySummary[]` |
| DELETE | `/properties/{id}` | — | `PropertySummary[]` |

Subscription billing is managed by Paystack — see [PAYSTACK.md](./PAYSTACK.md).

### Profile update

`PATCH /profile` body:

```json
{
  "firstName": "Nicolette",
  "lastName": "Botha",
  "phone": "082 123 4567",
  "preferredContact": "whatsapp",
  "emailReminders": true,
  "whatsAppReminders": true
}
```

Email is read-only (login identity). Demo users without a stored password can set one without `currentPassword`.

### Change password error codes

| Code | HTTP | Meaning |
|------|------|---------|
| `wrong_password` | 400 | Current password incorrect |
| `current_password_required` | 400 | Account has a password set |
| `password_too_short` | 400 | Fewer than 8 characters |
| `password_mismatch` | 400 | New vs confirm differ |

## Client portal routes

| UI area | Angular route | API |
|---------|---------------|-----|
| Dashboard | `/client/dashboard` | dashboard, properties, bookings, reports |
| Properties | `/client/properties` | properties CRUD |
| Bookings | `/client/bookings` | bookings + reschedule |
| Book clean | dashboard drawer | POST `/bookings`, GET upcoming |
| Subscription | `/client/subscription` | subscription + portfolio |
| Reports | `/client/reports` | reports |

Booking/reschedule calendars in the UI use **live dates** (weekdays, minimum 3 days ahead).

## Staff job completion → client report

When staff completes a job via `POST /api/v1/staff/jobs/{id}/complete` with a `report` payload, a cleaning report is upserted in MongoDB for the linked `customerId`, `ReportsPublished` is set on the customer, and the booking is marked completed.
