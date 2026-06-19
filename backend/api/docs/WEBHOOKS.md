# Webhooks

External integrations that push data into Solanist without user login.

## Bark lead capture

Simulates Bark.com email lead ingestion into the admin leads inbox.

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/webhooks/bark/leads` | Header `X-Webhook-Secret` |

### Secret

Configure `Webhooks__BarkSecret` (default: `demo-bark-secret`).

Docker Compose: `BARK_WEBHOOK_SECRET` env var maps to this setting.

Render: `Webhooks__BarkSecret` on `solanist-bff` (auto-generated in `render.yaml`, or set your own).

### Request body

```json
{
  "customerName": "Amanda Govender",
  "customerEmail": "amanda@email.com",
  "customerPhone": "082 555 1234",
  "propertyAddress": "Waterfall Estate",
  "city": "Midrand",
  "postcode": "1686",
  "requestSnippet": "Need quarterly solar panel cleaning quote.",
  "urgency": "normal",
  "panelCount": 18,
  "roofType": "Tile"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `customerName` | yes | |
| `customerEmail` | yes | |
| `customerPhone` | yes | |
| `propertyAddress` | yes | Street or estate name |
| `city` | yes | Used for hotspot map + scheduling |
| `postcode` | no | |
| `requestSnippet` | yes | Bark message / job description |
| `notes` | no | Internal notes |
| `urgency` | no | `normal` (default) or `urgent` |
| `panelCount` | no | Default `16` |
| `roofType` | no | Default `Tile` |
| `province` | no | Default `Gauteng` |
| `source` | no | Always stored as `bark_email` for this webhook |

### Example

```bash
curl -X POST http://localhost:8080/api/v1/webhooks/bark/leads \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: demo-bark-secret" \
  -d '{
    "customerName": "Test Lead",
    "customerEmail": "test@email.com",
    "customerPhone": "082 000 0001",
    "propertyAddress": "Fourways",
    "city": "Fourways",
    "postcode": "2055",
    "requestSnippet": "Panels need cleaning before winter.",
    "urgency": "urgent",
    "panelCount": 20
  }'
```

Response: `{ "data": { ...AdminLead... }, "message": "Lead captured from Bark." }`

The new lead appears in **Admin → Leads Inbox** immediately.

---

## Bark → Zapier → Solanist

Use Zapier when Bark sends lead notifications by email (or when you want to transform/filter before posting to Solanist).

### Flow

```text
Bark (new / purchased lead)
    → Zapier trigger
    → Webhooks by Zapier (POST JSON)
    → POST /api/v1/webhooks/bark/leads
    → Admin → Leads Inbox
```

### 1. Endpoint and secret

| Environment | URL |
|-------------|-----|
| Production | `https://YOUR-APP.onrender.com/api/v1/webhooks/bark/leads` |
| Local Docker | `http://localhost:8080/api/v1/webhooks/bark/leads` |

Use the **app** URL (nginx proxies `/api/` to the BFF), not the BFF port directly.

Set the same secret in Zapier and in Solanist (`Webhooks__BarkSecret` / `BARK_WEBHOOK_SECRET`).

### 2. Create the Zap

**Trigger (pick one):**

| Option | When to use |
|--------|-------------|
| **Email by Zapier** → New Inbound Email | Bark forwards lead alerts to a Zapier inbox address |
| **Gmail / Outlook** → New Email Matching Search | Filter on sender `bark.com` or subject containing “New lead” |
| **Schedule** + manual test | One-off testing only |

**Action:** **Webhooks by Zapier** → **POST**

| Setting | Value |
|---------|-------|
| URL | Your endpoint URL (table above) |
| Payload type | JSON |
| Headers | `X-Webhook-Secret` = your secret |
| | `Content-Type` = `application/json` |

**Data** — map Bark fields to Solanist JSON keys:

```json
{
  "customerName": "{{customer name from Bark}}",
  "customerEmail": "{{email}}",
  "customerPhone": "{{phone}}",
  "propertyAddress": "{{address or suburb}}",
  "city": "{{city or suburb}}",
  "postcode": "{{postcode}}",
  "requestSnippet": "{{job description or email body}}",
  "urgency": "normal",
  "panelCount": 16
}
```

Tips for email-based triggers:

- Map **email body** or **parsed fields** into `requestSnippet` — this field is required.
- If Bark only gives a suburb, use it for both `propertyAddress` and `city`.
- Set `urgency` to `urgent` when the subject/body contains “urgent” (use a Zapier **Formatter** or **Paths** step).

### 3. Test the Zap

1. In Zapier, send a test POST — expect HTTP **200** and a JSON `data` object with the new lead `id`.
2. In Solanist, open **Admin → Leads Inbox** — the lead should appear with source `bark_email`.
3. If you get **401**, the `X-Webhook-Secret` header does not match `Webhooks__BarkSecret`.
4. If you get **400**, `customerName` or `requestSnippet` is missing.

### 4. Production checklist

- [ ] Set a strong `Webhooks__BarkSecret` on Render (not `demo-bark-secret`)
- [ ] Use HTTPS app URL only
- [ ] Turn Zap on after a successful test
- [ ] Optional: add a Zapier **Filter** so only purchased Bark leads are forwarded

### Alternative: manual sync in admin

Admins can pull a demo Bark lead without Zapier:

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/admin/leads/sync-bark` | JWT `admin` role |

The admin UI **Import Bark Emails** button calls this endpoint.

---

## Admin manual create

Admins can also create leads via JWT:

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/admin/leads` | JWT `admin` role |

Same request body as the Bark webhook (any `source` value).
