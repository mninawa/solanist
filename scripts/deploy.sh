#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "Building and deploying Solanist via Docker..."
docker compose up --build -d

echo ""
docker compose ps
echo ""
echo "External client: http://localhost:${EXTERNAL_CLIENT_PORT:-8080}"
echo "BFF API:         http://localhost:${BFF_EXTERNAL_PORT:-8081}/api/v1/health"
echo ""
echo "Run smoke tests: npm run smoke"
