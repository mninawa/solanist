#!/usr/bin/env bash
# Post-deploy smoke tests — run after `npm run deploy` or Render deploy.
set -euo pipefail

BASE="${SMOKE_BASE_URL:-http://localhost:8080}"
API="${BASE}/api/v1"
BARK_SECRET="${BARK_WEBHOOK_SECRET:-demo-bark-secret}"
PASS="${SMOKE_PASSWORD:-demo}"

pass=0
fail=0

check() {
  local name="$1"
  local ok="$2"
  if [[ "$ok" == "1" ]]; then
    echo "  ✓ $name"
    pass=$((pass + 1))
  else
    echo "  ✗ $name"
    fail=$((fail + 1))
  fi
}

login_token() {
  local email="$1"
  local portal="${2:-}"
  if [[ "${GOOGLE_ONLY:-false}" == "true" ]]; then
    local body
    if [[ -n "$portal" ]]; then
      body="{\"idToken\":\"mock:$email\",\"portal\":\"$portal\"}"
    else
      body="{\"idToken\":\"mock:$email\"}"
    fi
    curl -sf -X POST "$API/auth/google" \
      -H "Content-Type: application/json" \
      -d "$body" \
      | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])"
  else
    curl -sf -X POST "$API/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$email\",\"password\":\"$PASS\"}" \
      | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])"
  fi
}

echo "Solanist smoke tests"
echo "Base: $BASE"
echo ""

# --- Health ---
echo "Health"
health=$(curl -sf "$API/health" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['status'])" 2>/dev/null || echo "")
check "BFF health via app proxy" "$([[ "$health" == "healthy" ]] && echo 1 || echo 0)"

auth_config=$(curl -sf "$API/auth/config" 2>/dev/null || echo "")
check "Auth config" "$([[ -n "$auth_config" ]] && echo 1 || echo 0)"

GOOGLE_ONLY=$(echo "$auth_config" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'].get('googleOnly', False))" 2>/dev/null || echo False)
if [[ "$GOOGLE_ONLY" == "True" || "$GOOGLE_ONLY" == "true" ]]; then
  GOOGLE_ONLY=true
else
  GOOGLE_ONLY=false
fi

# --- Admin ---
echo "Admin"
ADMIN_TOKEN=$(login_token "admin@solanist.co.za" 2>/dev/null || echo "")
check "Admin login" "$([[ -n "$ADMIN_TOKEN" ]] && echo 1 || echo 0)"

if [[ -n "$ADMIN_TOKEN" ]]; then
  dash=$(curl -sf "$API/admin/dashboard" -H "Authorization: Bearer $ADMIN_TOKEN" \
    | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(len(d.get('funnel',[])))" 2>/dev/null || echo 0)
  check "Admin dashboard" "$([[ "$dash" -gt 0 ]] && echo 1 || echo 0)"

  search=$(curl -sf "$API/admin/search?q=nicolette" -H "Authorization: Bearer $ADMIN_TOKEN" \
    | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data'].get('customers',[])))" 2>/dev/null || echo 0)
  check "Admin search" "$([[ "$search" -ge 0 ]] && echo 1 || echo 0)"

  LEAD_ID=$(curl -sf "$API/admin/leads" -H "Authorization: Bearer $ADMIN_TOKEN" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])" 2>/dev/null || echo "")
  if [[ -n "$LEAD_ID" ]]; then
    note_ok=$(curl -sf -X POST "$API/admin/leads/$LEAD_ID/notes" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"note":"Smoke test note"}' \
      | python3 -c "import sys,json; print(1 if 'Smoke test note' in json.load(sys.stdin)['data'].get('conversationNotes','') else 0)" 2>/dev/null || echo 0)
    check "Admin lead add note" "$note_ok"
  fi
fi

# --- Bark webhook ---
echo "Integrations"
webhook=$(curl -sf -X POST "$API/webhooks/bark/leads" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $BARK_SECRET" \
  -d '{
    "customerName": "Smoke Test Lead",
    "customerEmail": "smoke.test@email.com",
    "customerPhone": "082 999 0001",
    "propertyAddress": "Smoke Estate",
    "city": "Sandton",
    "requestSnippet": "Automated smoke test lead."
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")
check "Bark webhook ingest" "$([[ -n "$webhook" ]] && echo 1 || echo 0)"

bad_webhook=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/webhooks/bark/leads" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: wrong-secret" \
  -d '{"customerName":"X","customerEmail":"x@x.com","customerPhone":"1","propertyAddress":"X","city":"X","requestSnippet":"X"}')
check "Bark webhook rejects bad secret" "$([[ "$bad_webhook" == "401" ]] && echo 1 || echo 0)"

# --- Client ---
echo "Client"
CLIENT_TOKEN=$(login_token "nicolette.botha@email.com" 2>/dev/null || echo "")
check "Client login" "$([[ -n "$CLIENT_TOKEN" ]] && echo 1 || echo 0)"

if [[ -n "$CLIENT_TOKEN" ]]; then
  props=$(curl -sf "$API/client/properties" -H "Authorization: Bearer $CLIENT_TOKEN" \
    | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data']))" 2>/dev/null || echo 0)
  check "Client properties" "$([[ "$props" -ge 0 ]] && echo 1 || echo 0)"
fi

# --- Staff ---
echo "Staff"
STAFF_TOKEN=$(login_token "james.staff@solanist.co.za" 2>/dev/null || echo "")
check "Staff login" "$([[ -n "$STAFF_TOKEN" ]] && echo 1 || echo 0)"

if [[ -n "$STAFF_TOKEN" ]]; then
  jobs=$(curl -sf "$API/staff/dashboard" -H "Authorization: Bearer $STAFF_TOKEN" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['totalCount'])" 2>/dev/null || echo 0)
  check "Staff dashboard" "$([[ "$jobs" -ge 0 ]] && echo 1 || echo 0)"

  printf '\xff\xd8\xff\xe0\x00\x10JFIF' > /tmp/solanist-smoke.jpg
  upload_code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/uploads/photos" \
    -H "Authorization: Bearer $STAFF_TOKEN" \
    -F "files=@/tmp/solanist-smoke.jpg;type=image/jpeg")
  check "S3 photo upload" "$([[ "$upload_code" == "200" ]] && echo 1 || echo 0)"
fi

# --- Public invite ---
echo "Funnel"
invite=$(curl -sf "$API/invites/NB7XK2" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['code'])" 2>/dev/null || echo "")
check "Public invite lookup" "$([[ "$invite" == "NB7XK2" ]] && echo 1 || echo 0)"

nb_blocked=$(curl -sf "$API/invites/NB7XK2" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'].get('signupBlockedReason') or '')" 2>/dev/null || echo "")
check "Invite blocks registered email on load" "$([[ "$nb_blocked" == "email_exists" ]] && echo 1 || echo 0)"

# --- Password reset (disabled when Google SSO is required) ---
echo "Auth"
if [[ "$GOOGLE_ONLY" == "true" ]]; then
  forgot_code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/auth/forgot-password" \
    -H "Content-Type: application/json" \
    -d '{"email":"nicolette.botha@email.com"}')
  check "Forgot password disabled (Google SSO)" "$([[ "$forgot_code" == "403" ]] && echo 1 || echo 0)"

  reset_code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/auth/reset-password" \
    -H "Content-Type: application/json" \
    -d '{"token":"invalid","newPassword":"newpassword123","confirmPassword":"newpassword123"}')
  check "Reset password disabled (Google SSO)" "$([[ "$reset_code" == "403" ]] && echo 1 || echo 0)"

  role_mismatch=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/auth/google" \
    -H "Content-Type: application/json" \
    -d '{"idToken":"mock:admin@solanist.co.za","portal":"client"}')
  check "Google login rejects role mismatch" "$([[ "$role_mismatch" == "403" ]] && echo 1 || echo 0)"
else
  forgot=$(curl -sf -X POST "$API/auth/forgot-password" \
    -H "Content-Type: application/json" \
    -d '{"email":"nicolette.botha@email.com"}' \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accepted'])" 2>/dev/null || echo "")
  check "Forgot password" "$([[ "$forgot" == "True" || "$forgot" == "true" ]] && echo 1 || echo 0)"

  bad_reset=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/auth/reset-password" \
    -H "Content-Type: application/json" \
    -d '{"token":"invalid","newPassword":"newpassword123","confirmPassword":"newpassword123"}')
  check "Reset password rejects invalid token" "$([[ "$bad_reset" == "400" ]] && echo 1 || echo 0)"
fi

if [[ -n "$ADMIN_TOKEN" ]]; then
  settings=$(curl -sf "$API/admin/settings" -H "Authorization: Bearer $ADMIN_TOKEN" \
    | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data'].get('integrations',[])))" 2>/dev/null || echo 0)
  check "Admin settings" "$([[ "$settings" -ge 4 ]] && echo 1 || echo 0)"

  plan_count=$(curl -sf "$API/admin/subscriptions/plans" -H "Authorization: Bearer $ADMIN_TOKEN" \
    | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data']))" 2>/dev/null || echo 0)
  check "Admin service plans" "$([[ "$plan_count" -ge 1 ]] && echo 1 || echo 0)"

  s3_status=$(curl -sf "$API/admin/settings" -H "Authorization: Bearer $ADMIN_TOKEN" \
    | python3 -c "import sys,json; s=[i for i in json.load(sys.stdin)['data']['integrations'] if i['key']=='s3'][0]; print(s['status'])" 2>/dev/null || echo "")
  check "S3 integration connected" "$([[ "$s3_status" == "connected" ]] && echo 1 || echo 0)"
fi

echo ""
echo "Results: $pass passed, $fail failed"
if [[ "$fail" -gt 0 ]]; then
  exit 1
fi
echo "All smoke tests passed."
