#!/usr/bin/env bash
set -euo pipefail
umask 077

APP_DIR="${APP_DIR:-/opt/ai-agency}"
ENV_FILE="${ENV_FILE:-/etc/ai-agency/production.env}"
BACKUP_ENV_FILE="${BACKUP_ENV_FILE:-/etc/ai-agency/backup.env}"
SECRETS_DIR="${SECRETS_DIR:-/etc/ai-agency/secrets}"
STAGING_ROOT="${STAGING_ROOT:-/var/backups/ai-agency}"
COMPOSE_FILE="${APP_DIR}/compose.production.yml"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
STAGING_DIR="${STAGING_ROOT}/${TIMESTAMP}"
MONITORING_STOPPED=0

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi
for required in "$ENV_FILE" "$BACKUP_ENV_FILE" "${APP_DIR}/compose.production.yml"; do
  if [[ ! -r "$required" ]]; then
    echo "Required file is missing or unreadable: ${required}" >&2
    exit 1
  fi
done
if ! command -v restic >/dev/null 2>&1; then
  echo "Install restic on the host before running backups." >&2
  exit 1
fi

set -a
# These files are root-managed and must contain only trusted KEY=value settings.
# shellcheck disable=SC1090
. "$ENV_FILE"
# shellcheck disable=SC1090
. "$BACKUP_ENV_FILE"
set +a
SECRETS_DIR="${SECRETS_DIR:-/etc/ai-agency/secrets}"

: "${RESTIC_REPOSITORY:?Set RESTIC_REPOSITORY in backup.env}"
: "${RESTIC_PASSWORD_FILE:?Set RESTIC_PASSWORD_FILE in backup.env}"
: "${S3_ENDPOINT:?Set S3_ENDPOINT in backup.env}"
: "${AWS_ACCESS_KEY_ID:?Set S3 access credentials in backup.env}"
: "${AWS_SECRET_ACCESS_KEY:?Set S3 access credentials in backup.env}"
: "${APP_DB_NAME:?Set APP_DB_NAME in production.env}"
: "${APP_DB_USER:?Set APP_DB_USER in production.env}"
: "${N8N_DB_NAME:?Set N8N_DB_NAME in production.env}"
: "${N8N_DB_USER:?Set N8N_DB_USER in production.env}"

mkdir -p "$STAGING_DIR"
cleanup() {
  if [[ "$MONITORING_STOPPED" -eq 1 ]]; then
    compose start loki alloy prometheus grafana
  fi
  if [[ -n "$STAGING_DIR" && "$STAGING_DIR" == "${STAGING_ROOT}/"* ]]; then
    rm -rf -- "$STAGING_DIR"
  fi
}
trap cleanup EXIT

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

compose exec -T postgres sh -ec \
  'PGPASSWORD="$(cat /run/secrets/app_db_password)" pg_dump -h 127.0.0.1 -U "$APP_DB_USER" -Fc "$APP_DB_NAME"' \
  > "${STAGING_DIR}/application-db.dump"
compose exec -T postgres sh -ec \
  'PGPASSWORD="$(cat /run/secrets/n8n_db_password)" pg_dump -h 127.0.0.1 -U "$N8N_DB_USER" -Fc "$N8N_DB_NAME"' \
  > "${STAGING_DIR}/n8n-db.dump"

compose exec -T n8n sh -ec \
  'rm -rf /tmp/n8n-workflow-backup && mkdir -p /tmp/n8n-workflow-backup && n8n export:workflow --all --separate --output=/tmp/n8n-workflow-backup >&2 && tar -C /tmp/n8n-workflow-backup -cf - . && rm -rf /tmp/n8n-workflow-backup' \
  > "${STAGING_DIR}/n8n-workflows.tar"

compose exec -T redis sh -ec \
  'REDISCLI_AUTH="$(cat /run/secrets/redis_password)" redis-cli --rdb /tmp/redis-backup.rdb >/dev/null && cat /tmp/redis-backup.rdb && rm -f /tmp/redis-backup.rdb' \
  > "${STAGING_DIR}/redis-volume.rdb"

prometheus_container="$(compose ps -q prometheus)"
grafana_container="$(compose ps -q grafana)"
loki_container="$(compose ps -q loki)"
alloy_container="$(compose ps -q alloy)"
if [[ -z "$prometheus_container" || -z "$grafana_container" ||
  -z "$loki_container" || -z "$alloy_container" ]]; then
  echo "Prometheus, Grafana, Loki, and Alloy must be created before backing up their volumes." >&2
  exit 1
fi
prometheus_volume="$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/prometheus"}}{{.Name}}{{end}}{{end}}' "$prometheus_container")"
grafana_volume="$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/var/lib/grafana"}}{{.Name}}{{end}}{{end}}' "$grafana_container")"
loki_volume="$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/loki"}}{{.Name}}{{end}}{{end}}' "$loki_container")"
alloy_volume="$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/var/lib/alloy"}}{{.Name}}{{end}}{{end}}' "$alloy_container")"
if [[ -z "$prometheus_volume" || -z "$grafana_volume" ||
  -z "$loki_volume" || -z "$alloy_volume" ]]; then
  echo "Could not resolve named Prometheus, Grafana, Loki, and Alloy volumes." >&2
  exit 1
fi

MONITORING_STOPPED=1
compose stop alloy loki prometheus grafana
docker run --rm --volume "${prometheus_volume}:/volume:ro" \
  --entrypoint tar \
  postgres:16-alpine@sha256:721873c34ceb9f8d8fc265984940dc982404c105f19ad51be9fdc5970a6080ea \
  -czf - -C /volume . > "${STAGING_DIR}/prometheus-volume.tar.gz"
docker run --rm --volume "${grafana_volume}:/volume:ro" \
  --entrypoint tar \
  postgres:16-alpine@sha256:721873c34ceb9f8d8fc265984940dc982404c105f19ad51be9fdc5970a6080ea \
  -czf - -C /volume . > "${STAGING_DIR}/grafana-volume.tar.gz"
docker run --rm --volume "${loki_volume}:/volume:ro" \
  --entrypoint tar \
  postgres:16-alpine@sha256:721873c34ceb9f8d8fc265984940dc982404c105f19ad51be9fdc5970a6080ea \
  -czf - -C /volume . > "${STAGING_DIR}/loki-volume.tar.gz"
docker run --rm --volume "${alloy_volume}:/volume:ro" \
  --entrypoint tar \
  postgres:16-alpine@sha256:721873c34ceb9f8d8fc265984940dc982404c105f19ad51be9fdc5970a6080ea \
  -czf - -C /volume . > "${STAGING_DIR}/alloy-volume.tar.gz"
compose start loki alloy prometheus grafana
MONITORING_STOPPED=0

install -d -m 0700 "${STAGING_DIR}/host-config"
cp -a "$SECRETS_DIR" "${STAGING_DIR}/host-config/secrets"
cp "$ENV_FILE" "${STAGING_DIR}/host-config/production.env"
chmod -R go-rwx "${STAGING_DIR}"

restic -o "s3.endpoint=${S3_ENDPOINT}" backup \
  --host "$(hostname -f)" \
  --tag ai-agency \
  "$STAGING_DIR"
restic -o "s3.endpoint=${S3_ENDPOINT}" forget \
  --tag ai-agency \
  --keep-daily 7 \
  --keep-weekly 5 \
  --keep-monthly 12 \
  --prune

echo "Encrypted backup completed: ${TIMESTAMP}"
