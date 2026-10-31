#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/ai-agency}"
ENV_FILE="${ENV_FILE:-/etc/ai-agency/production.env}"
IMAGE_SHA="${1:-}"
IMAGE_REPOSITORY="${2:-}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi
if [[ ! "$IMAGE_SHA" =~ ^[a-f0-9]{40}$ ]]; then
  echo "Usage: $0 <40-character-commit-sha> <github-owner/repository>" >&2
  exit 2
fi
if [[ ! "$IMAGE_REPOSITORY" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
  echo "Image repository must be a GitHub owner/repository pair." >&2
  exit 2
fi
if [[ ! -r "$ENV_FILE" || ! -f "${APP_DIR}/compose.production.yml" ]]; then
  echo "Production environment or Compose file is missing." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a
: "${API_DOMAIN:?Set API_DOMAIN in production.env}"
: "${N8N_DOMAIN:?Set N8N_DOMAIN in production.env}"
domain_pattern='^([[:alnum:]]([[:alnum:]-]{0,61}[[:alnum:]])?\.)+[[:alpha:]]{2,63}$'
if [[ ! "$API_DOMAIN" =~ $domain_pattern || ! "$N8N_DOMAIN" =~ $domain_pattern ]]; then
  echo "API_DOMAIN and N8N_DOMAIN must be valid DNS hostnames." >&2
  exit 1
fi
if [[ "$API_DOMAIN" == "$N8N_DOMAIN" ]]; then
  echo "API_DOMAIN and N8N_DOMAIN must be different hostnames." >&2
  exit 1
fi
if [[ ! -r "/etc/letsencrypt/live/${API_DOMAIN}/fullchain.pem" ||
  ! -r "/etc/letsencrypt/live/${API_DOMAIN}/privkey.pem" ]]; then
  echo "Issue the TLS certificate before deploying the production stack." >&2
  exit 1
fi

IMAGE_REPOSITORY="$(printf '%s' "$IMAGE_REPOSITORY" | tr '[:upper:]' '[:lower:]')"
API_IMAGE="ghcr.io/${IMAGE_REPOSITORY}:sha-${IMAGE_SHA}"
export API_IMAGE

compose() {
  docker compose --env-file "$ENV_FILE" -f "${APP_DIR}/compose.production.yml" "$@"
}

compose pull
compose up -d --wait --wait-timeout 180

temporary="${ENV_FILE}.tmp"
awk -v image="$API_IMAGE" '
  BEGIN { replaced = 0 }
  /^API_IMAGE=/ { print "API_IMAGE=" image; replaced = 1; next }
  { print }
  END { if (!replaced) print "API_IMAGE=" image }
' "$ENV_FILE" > "$temporary"
chmod 0600 "$temporary"
mv "$temporary" "$ENV_FILE"

echo "Deployment healthy: ${API_IMAGE}"
