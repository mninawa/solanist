# Paystack subscriptions

All client subscription billing is handled by **Paystack** (ZAR). Solanist stores plan state in MongoDB; Paystack charges cards and sends webhooks to keep payments in sync.

## Flow

```text
Client → Plan & Subscriptions → Pay with Paystack
    → POST /client/paystack/initialize
    → Paystack inline popup (card / EFT)
    → charge.success webhook (+ optional POST /client/paystack/verify)
    → Mongo: subscription active, payment recorded, property activated
```

Recurring billing uses Paystack **plans** (`quarterly` interval recommended for Solar Care).

## API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/client/paystack/config` | Client JWT | `{ enabled, publicKey }` |
| POST | `/api/v1/client/paystack/initialize` | Client JWT | Start checkout `{ propertyId?, planName? }` |
| POST | `/api/v1/client/paystack/verify` | Client JWT | Confirm after popup `{ reference }` |
| POST | `/api/v1/client/paystack/cancel` | Client JWT | Disable Paystack subscription |
| POST | `/api/v1/webhooks/paystack` | Paystack signature | Webhook events |

### Webhook events handled

| Event | Action |
|-------|--------|
| `charge.success` | Record payment, update card label, activate property |
| `subscription.create` | Store `PaystackSubscriptionCode` + email token |
| `subscription.disable` / `subscription.not_renew` | Mark subscription cancelled, pause properties |
| `invoice.payment_failed` | Mark subscription `payment_failed` |

Signature header: `x-paystack-signature` (HMAC SHA512 of raw body with secret key).

## Setup

### 1. Paystack Dashboard

1. Create account at [paystack.com](https://paystack.com) (South Africa).
2. Create **Plans** matching Solanist plans (e.g. Quarterly Solar Care — `quarterly`, amount in cents).
3. Copy **Public** and **Secret** keys.
4. Set webhook URL:

```text
https://YOUR-APP.onrender.com/api/v1/webhooks/paystack
```

Local Docker (with tunnel e.g. ngrok):

```text
https://YOUR-TUNNEL/api/v1/webhooks/paystack
```

### 2. Environment variables

```env
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_CALLBACK_URL=https://your-app.onrender.com/client/subscription
PAYSTACK_PLAN_QUARTERLY=PLN_xxxxxxxx
```

Docker / Render mapping:

| Env | BFF setting |
|-----|-------------|
| `PAYSTACK_SECRET_KEY` | `Paystack__SecretKey` |
| `PAYSTACK_PUBLIC_KEY` | `Paystack__PublicKey` |
| `PAYSTACK_CALLBACK_URL` | `Paystack__CallbackUrl` |
| `PAYSTACK_PLAN_QUARTERLY` | `Paystack__Plans__Quarterly Solar Care` |

Plan codes map Solanist plan names to Paystack `PLN_*` codes in `appsettings.json` → `Paystack:Plans`.

**Admin Settings** (`/admin/settings`) is the preferred way to manage plans: create/edit service plans in MongoDB (`service_plans` collection), paste an existing `PLN_*` code, or use **Create on Paystack** to register a new recurring plan via the Paystack API. Checkout resolves plan codes from the catalogue first, then falls back to environment config.

### 3. Mongo fields

| Collection | Fields |
|------------|--------|
| `service_plans` | `PaystackPlanCode`, `PaystackInterval`, `PricePerVisit`, `VisitsPerYear`, `Active` |
| `customers` | `PaystackCustomerCode` |
| `subscriptions` | `PaymentProvider`, `PaystackSubscriptionCode`, `PaystackPlanCode`, `PaystackEmailToken` |
| `payments` | `PaymentProvider`, `PaystackReference` |

## Client UI

- **Plan & Subscriptions** — Paystack setup banner for `setup_required` properties
- **Manage plan** — Update payment method / cancel via Paystack
- **Billing history** — Populated from Paystack `charge.success` webhooks

Without Paystack keys, endpoints return **503** and the UI hides Paystack actions (demo/mock billing unchanged).

## Testing

Use Paystack **test keys** (`sk_test_…`, `pk_test_…`) and test cards from Paystack docs.

```bash
# Config (requires client JWT)
curl -s http://localhost:8080/api/v1/client/paystack/config \
  -H "Authorization: Bearer $CLIENT_TOKEN"
```

See also [CLIENT_API.md](./CLIENT_API.md) and [PRODUCTION.md](../../docs/PRODUCTION.md).
