# Staff Field Operations

End-to-end flow for field technicians: today's route → job workspace → client report.

## Flow diagram

```text
Staff login (james.staff@solanist.co.za)
    → Dashboard / Schedule
    → Open job → Check in
    → Before photos + kWh reading
    → Cleaning checklist
    → After photos + kWh reading
    → Review & Complete (+ notes)
    → Client report published (Mongo reports + booking completed)
    → Admin Issues (if issue reported mid-job)
```

## Demo walkthrough

### 1. Login

| Field | Value |
|-------|-------|
| Email | `james.staff@solanist.co.za` |
| Password | any (demo) |
| Portal | `/staff/dashboard` |

### 2. Today's jobs

Open **Sunrise Farm** (`job-004`) — reset to a fresh workflow state on every deploy.

Alternative jobs on today's board:

| Job | Customer | Notes |
|-----|----------|-------|
| `job-002` | Nicolette Botha | Hurlingham View — open clean |
| `job-004` | Sarah van der Merwe | **Recommended demo workflow job** |
| `job-003` | David Khumalo | Pre-seeded **issue** (staff-002) |

### 3. Job workspace steps

| Step | Route | Requirement |
|------|-------|-------------|
| Check in | `/staff/jobs/{id}/check-in` | GPS note optional |
| Before photos | `.../before-photos` | 3+ photos, before kWh |
| Checklist | `.../checklist` | All required items ticked |
| After photos | `.../after-photos` | 3+ photos, after kWh |
| Complete | `.../complete` | Notes + submit |

Use **Upload** on photo steps — files go to S3 (`solanist` bucket, `staff-photos/` prefix) when AWS credentials are configured; otherwise local mock URLs are used for dev.

### 4. Report issue (optional branch)

From job detail → **Report issue** or `/staff/jobs/{id}/issue`.

Issue appears in:

- Staff → **Issues**
- Admin → **Issues** (`GET /admin/issues`)

Demo issue pre-loaded on `job-003` (David Khumalo — gate code).

### 5. After completion

Mongo upserts:

- `reports` → `report-job-{jobId}`
- Customer `reportsPublished = true`
- Linked booking → `completed`

Client sees the report at `/client/reports/report-job-{jobId}` (login as that customer).

## API reference

| Step | Endpoint | Doc |
|------|----------|-----|
| Dashboard | `GET /staff/dashboard` | [STAFF_API.md](./STAFF_API.md) |
| Schedule | `GET /staff/schedule?from=&to=` | [STAFF_API.md](./STAFF_API.md) |
| Check in | `POST /staff/jobs/{id}/check-in` | [STAFF_API.md](./STAFF_API.md) |
| Photos | `POST /staff/jobs/{id}/photos` | [STAFF_API.md](./STAFF_API.md) |
| Upload files | `POST /uploads/photos` (multipart, staff JWT) | Returns S3 HTTPS URLs |
| Checklist | `PUT /staff/jobs/{id}/checklist` | [STAFF_API.md](./STAFF_API.md) |
| Issue | `POST /staff/jobs/{id}/issue` | [STAFF_API.md](./STAFF_API.md) |
| Complete | `POST /staff/jobs/{id}/complete` | [STAFF_API.md](./STAFF_API.md) |
| Admin issues | `GET /admin/issues` | [ADMIN_API.md](./ADMIN_API.md) |

## curl smoke test (job-004)

```bash
BASE=http://localhost:8080/api/v1
TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"james.staff@solanist.co.za","password":"demo"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

JOB=job-004
IMG="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600"

curl -s -X POST "$BASE/staff/jobs/$JOB/check-in" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"note":"On site"}' > /dev/null

curl -s -X POST "$BASE/staff/jobs/$JOB/photos" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"type\":\"before\",\"photos\":[\"$IMG\",\"$IMG\",\"$IMG\"]}" > /dev/null

curl -s -X PATCH "$BASE/staff/jobs/$JOB" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"beforeKwhReading":12400.0}' > /dev/null

# ... checklist, after photos, complete — see deploy verify script
```

## Demo maintenance

On BFF startup (Mongo):

- Open jobs on seed date roll forward to **UTC today**
- `job-004` resets to fresh workflow state (photos/checklist cleared)
- `job-003` keeps demo issue for staff-002
- Future jobs (`job-005` … `job-007`) seeded relative to today for schedule view
