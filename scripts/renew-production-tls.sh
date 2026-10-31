#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/ai-agency}"
ENV_FILE="${ENV_FILE:-/etc/ai-agency/production.env}"
COMPOSE_FILE="${APP_DIR}/compose.production.yml"
PROXY_STOPPED=0

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

restart_proxy() {
  if [[ "$PROXY_STOPPED" -eq 1 ]]; then
    compose start nginx
  fi
}
trap restart_proxy EXIT

compose stop nginx
PROXY_STOPPED=1
certbot renew --non-interactive --quiet
compose start nginx
PROXY_STOPPED=0
