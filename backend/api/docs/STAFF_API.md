# Staff API (`/api/v1/staff`)

Requires JWT with `staff` role. Send `Authorization: Bearer <token>`.

Staff user `james.staff@solanist.co.za` → `staff_id: staff-001` in token.

## Read

| Method | Path | Response |
|--------|------|----------|
| GET | `/dashboard` | Today's route (`StaffDashboard`) |
| GET | `/profile` | Logged-in staff member |
| GET | `/schedule` | Jobs in date range (`?from=yyyy-MM-dd&to=yyyy-MM-dd`, default 14 days) |
| GET | `/jobs` | All assigned jobs (full detail) |
| GET | `/jobs/{id}` | Single job |

## Workflow

| Method | Path | Body | Notes |
|--------|------|------|-------|
| POST | `/jobs/{id}/check-in` | `{ note?, latitude?, longitude? }` | Starts job |
| POST | `/jobs/{id}/photos` | `{ type: "before"\|"after", photos: string[] }` | Append photos |
| PUT | `/jobs/{id}/checklist` | `{ checklist: ChecklistItem[] }` | Replace checklist |
| PATCH | `/jobs/{id}` | `UpdateStaffJobRequest` | Notes, kWh, on-the-way, photos |
| POST | `/jobs/{id}/issue` | `{ issueType, description }` | Report issue |
| POST | `/jobs/{id}/complete` | `{ notes, report? }` | Complete + publish client report |

## File uploads (`/api/v1/uploads`)

Staff JWT required. Multipart form field **`files`** (one or more images, max 20 MB total).

| Method | Path | Response |
|--------|------|----------|
| POST | `/photos` | `{ urls: string[] }` — HTTPS URLs on S3 bucket **`solanist`** (`staff-photos/YYYY/MM/…`) |

When S3 credentials are not configured, returns **503** and the Angular app falls back to local blob URLs for dev.

Typical flow: `POST /uploads/photos` → pass returned URLs to `POST /staff/jobs/{id}/photos`.

### `UpdateStaffJobRequest` (PATCH)

Optional fields: `onTheWay`, `arrived`, `completionNotes`, `beforeKwhReading`, `afterKwhReading`, `beforePhotos`, `afterPhotos`, `checklist`.

### `CompleteJobRequest.report`

When provided, upserts a cleaning report in Mongo for the customer (`report-job-{jobId}`).

## Scoping

Jobs are filtered by JWT `staff_id`. Demo jobs are assigned to `staff-001`.

Open demo jobs roll their `scheduledDate` to UTC today on BFF startup so the dashboard always shows work.

Future demo jobs (`job-005` … `job-007`) are seeded with dates relative to UTC today for the schedule week view.

## Angular

`StaffService.getSchedule(from, to)` passes the date range to the API. The schedule page shows a Monday–Sunday week navigator with prev/next and **This week**.

`StaffService.getProfile()` → `GET /staff/profile` when `mockMode: false`.

Full field workflow walkthrough: [STAFF_FIELD_OPS.md](./STAFF_FIELD_OPS.md).

## Staff portal routes

| UI area | Angular route | API |
|---------|---------------|-----|
| Dashboard | `/staff/dashboard` | dashboard |
| Schedule | `/staff/schedule` | schedule |
| Job workspace | `/staff/jobs/:id/...` | check-in, photos, checklist, complete |
| Issues | `/staff/issues` | jobs with issue |
| Reports | `/staff/reports` | completed jobs |
| Messages | `/staff/messages` | Derived from today's job instructions + route |

Completing a job with a `report` payload publishes a client cleaning report (`report-job-{jobId}`).

## MongoDB collections

- `staff_jobs` — job state (checklist, photos, kWh, completion)
- `users` — staff login (`user-staff-001`)
