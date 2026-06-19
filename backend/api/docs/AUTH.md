# Authentication

## Google Sign-In (required)

All users sign in with Google. Password login, signup, reset, and change-password are disabled when `Auth__GoogleClientId` is set.

| Method | Path | Body |
|--------|------|------|
| GET | `/api/v1/auth/config` | Returns `{ googleEnabled, googleClientId, googleOnly }` |
| POST | `/api/v1/auth/google` | `{ idToken, portal? }` → session (`portal`: `client`, `staff`, or `admin`) |
| POST | `/api/v1/auth/signup/google` | `{ idToken, inviteCode, … }` → session (new customers) |

### Setup

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an **OAuth 2.0 Client ID** (type: **Web application**)
3. Authorized JavaScript origins:
   - `http://localhost:8080` (local Docker)
   - `https://your-app.onrender.com` (production)
4. Set env var on BFF:

```bash
Auth__GoogleClientId=YOUR_CLIENT_ID.apps.googleusercontent.com
```

Local Docker: `AUTH_GOOGLE_CLIENT_ID` in `.env` (see `.env.example`).

**Do not** set `Auth__AllowMockGoogleLogin` in production. Local Docker defaults it to `true` for smoke tests (`mock:email` tokens).

### Behaviour

- Validates the Google ID token server-side (audience = your client ID)
- **Login** (`POST /auth/google`) — matches an existing user by email or Google ID
- **Invite signup** (`POST /auth/signup/google`) — creates account from invite; Google email must match the invite email
- New customers must complete **invite onboarding** first — login returns `account_not_found` if no user exists
- When Google is configured, password endpoints return `403 password_disabled`:
  - `POST /auth/login`
  - `POST /auth/signup`
  - `POST /auth/forgot-password`
  - `POST /auth/reset-password`
  - `POST /api/v1/client/profile/change-password`

### Sign-in and routing

Everyone uses a single sign-in page at `/login` (Google Sign-In). After authentication, the app routes by role:

| Role | Dashboard |
|------|-----------|
| Customer | `/client/dashboard` |
| Staff | `/staff/dashboard` |
| Admin | `/admin/dashboard` |

`POST /auth/google` accepts an optional `portal` field for API clients. The web app omits it so any role can sign in from one page. If `portal` is sent and does not match the user’s role, the API returns `403 role_mismatch`.

Staff and admin accounts must use Google with the email on their Solanist user record.
