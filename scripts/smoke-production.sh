#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-}"
APP_DIR="${APP_DIR:-/opt/ai-agency}"
ENV_FILE="${ENV_FILE:-/etc/ai-agency/production.env}"
if [[ ! "$BASE_URL" =~ ^https://[A-Za-z0-9.-]+$ ]]; then
  echo "Usage: $0 https://api.example.com" >&2
  exit 2
fi

curl --fail --silent --show-error --max-time 15 "${BASE_URL}/api/v1/health/live"
curl --fail --silent --show-error --max-time 15 "${BASE_URL}/api/v1/health/ready"
docker compose --env-file "$ENV_FILE" -f "${APP_DIR}/compose.production.yml" \
  exec -T api node -e \
  "fetch('http://127.0.0.1:3000/metrics', { signal: AbortSignal.timeout(10000) }).then(async (response) => { const body = await response.text(); if (!response.ok || !body.includes('ai_agency_http_requests_total')) process.exit(1); }).catch(() => process.exit(1));"

echo "Production smoke checks passed for ${BASE_URL}."
