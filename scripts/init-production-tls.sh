#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/ai-agency}"
ENV_FILE="${ENV_FILE:-/etc/ai-agency/production.env}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi
if [[ ! -r "$ENV_FILE" ]]; then
  echo "Production environment file is missing: ${ENV_FILE}" >&2
  exit 1
fi

set -a
# This host-managed file must contain only trusted KEY=value configuration.
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

: "${API_DOMAIN:?Set API_DOMAIN}"
: "${N8N_DOMAIN:?Set N8N_DOMAIN}"
: "${CERTBOT_EMAIL:?Set CERTBOT_EMAIL}"

domain_pattern='^([[:alnum:]]([[:alnum:]-]{0,61}[[:alnum:]])?\.)+[[:alpha:]]{2,63}$'
if [[ ! "$API_DOMAIN" =~ $domain_pattern || ! "$N8N_DOMAIN" =~ $domain_pattern ]]; then
  echo "API_DOMAIN and N8N_DOMAIN must be valid DNS hostnames." >&2
  exit 1
fi
if [[ "$API_DOMAIN" == "$N8N_DOMAIN" ]]; then
  echo "API_DOMAIN and N8N_DOMAIN must be different hostnames." >&2
  exit 1
fi
if [[ "$API_DOMAIN" == *.example.com || "$N8N_DOMAIN" == *.example.com ]]; then
  echo "Replace example.com with domains whose DNS points to this VPS." >&2
  exit 1
fi

if ! command -v certbot >/dev/null 2>&1; then
  echo "Install Certbot on the host before requesting the first certificate." >&2
  exit 1
fi

certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email "$CERTBOT_EMAIL" \
  --cert-name "$API_DOMAIN" \
  -d "$API_DOMAIN" \
  -d "$N8N_DOMAIN"

echo "Certificate created at /etc/letsencrypt/live/${API_DOMAIN}."
