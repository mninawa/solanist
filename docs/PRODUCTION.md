# Production checklist

Use this after deploying to Render or any hosted environment.

## Pre-deploy

- [ ] MongoDB Atlas cluster created with database user
- [ ] Atlas **Network Access** allows Render egress (`0.0.0.0/0` or specific IPs)
- [ ] `Mongo__ConnectionString` set on `solanist-bff` (never commit to git)
- [ ] `Webhooks__BarkSecret` set to a strong value (not `demo-bark-secret`)
- [ ] `Auth__SecretKey` generated (Render blueprint does this automatically)

See [RENDER.md](./RENDER.md) for blueprint deploy steps.

## Post-deploy smoke tests

From your machine (replace URL for production):

```bash
# Local Docker
npm run deploy
npm run smoke

# Render
SMOKE_BASE_URL=https://solanist-app.onrender.com npm run smoke
```

The script verifies:

| Area | Checks |
|------|--------|
| Health | BFF via app proxy |
| Admin | Login, dashboard, search |
| Integrations | Bark webhook + secret rejection |
| Client | Login, properties |
| Staff | Login, dashboard |
| Funnel | Public invite lookup |

Exit code `0` = all passed.

## Bark / Zapier

Lead capture options (pick one or combine):

| Method | Doc |
|--------|-----|
| Direct webhook (curl, custom integration) | [WEBHOOKS.md](../backend/api/docs/WEBHOOKS.md) |
| Zapier (email → POST) | [WEBHOOKS.md § Bark → Zapier](../backend/api/docs/WEBHOOKS.md) |
| Admin manual / Import Bark | [FUNNEL.md](../backend/api/docs/FUNNEL.md) |

Production webhook URL:

```text
https://YOUR-APP.onrender.com/api/v1/webhooks/bark/leads
```

Header: `X-Webhook-Secret: <Webhooks__BarkSecret value>`

## Environment reference

| Variable | Service | Required |
|----------|---------|----------|
| `Mongo__ConnectionString` | BFF | Yes (production) |
| `Mongo__DatabaseName` | BFF | No (default `solanist`) |
| `Auth__SecretKey` | BFF | Yes |
| `Webhooks__BarkSecret` | BFF | Yes (production) |
| `S3__BucketName` | BFF | Yes for real photo uploads (default `solanist`) |
| `S3__Region` | BFF | No (default `eu-west-1` — must match bucket region) |
| `S3__AccessKeyId` / `S3__SecretAccessKey` | BFF | Yes for S3 (or use IAM role / `AWS_ACCESS_KEY_ID`) |
| `S3__PublicBaseUrl` | BFF | No (CloudFront URL if used) |
| `Paystack__SecretKey` / `Paystack__PublicKey` | BFF | Yes for live subscription billing |
| `Paystack__Plans__*` | BFF | Paystack `PLN_*` codes per plan name |
| `Email__PostmarkServerToken` / `Email__FromAddress` | BFF | Password reset emails via Postmark |
| `WhatsApp__ApiKey` | BFF | Lead invite delivery via WasenderAPI |
| `Auth__GoogleClientId` | BFF | Google Sign-In (Web client ID) |
| `BFF_UPSTREAM` | App | Auto (Render blueprint) |

Local Docker mapping: see [`.env.example`](../.env.example).

## Demo data

On first BFF boot with an empty MongoDB, seed data is inserted automatically. Demo logins work with any password.

Demo maintenance on each startup (Mongo):

- Open staff jobs roll to UTC today
- `job-004` resets for field-ops walkthrough
- Funnel invite expiry refreshed

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| 401 on webhook | `X-Webhook-Secret` mismatch |
| Empty admin dashboard | Check Mongo connection string; BFF logs |
| Slow first request after idle | Starter tier stays warm; check Atlas connectivity and BFF logs |
| Client has no data | Confirm `mockMode: false` in Docker build (default) |
| Staff photos use blob URLs | Set `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` in `.env` (see S3 vars) |

## S3 photo uploads

Staff before/after photos upload to the **`solanist`** bucket under `staff-photos/YYYY/MM/`.

| Setting | Purpose |
|---------|---------|
| `S3__BucketName` | Bucket name (`solanist`) |
| `S3__Region` | AWS region (must match bucket — `solanist` is `eu-west-1`) |
| `S3__AccessKeyId` / `S3__SecretAccessKey` | IAM user with `s3:PutObject` on `staff-photos/*` |
| `S3__PublicRead` | When `true`, URLs assume bucket policy allows public reads (no object ACLs) |
| `S3__PublicBaseUrl` | Optional CDN base (e.g. CloudFront) |

Without AWS credentials, the BFF returns **503** and the app falls back to local blob URLs (dev only — not visible to clients after refresh).

Ensure the bucket allows public read on uploaded objects (ACL or bucket policy) so client reports can display photos.

## Paystack subscriptions

All client subscriptions bill through Paystack. See [PAYSTACK.md](../backend/api/docs/PAYSTACK.md) for plan setup, webhook URL, and test keys.

Production webhook:

```text
https://YOUR-APP.onrender.com/api/v1/webhooks/paystack
```

BFF logs on Render: Dashboard → `solanist-bff` → Logs.
