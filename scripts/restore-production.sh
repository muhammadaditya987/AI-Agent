#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/ai-agency}"
ENV_FILE="${ENV_FILE:-/etc/ai-agency/production.env}"
BACKUP_DIR="${1:-}"
COMPOSE_FILE="${APP_DIR}/compose.production.yml"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi
if [[ "${CONFIRM_RESTORE:-}" != "YES" ]]; then
  echo "This replaces both application databases. Set CONFIRM_RESTORE=YES to continue." >&2
  exit 2
fi
if [[ ! -d "$BACKUP_DIR" || ! -r "$ENV_FILE" ]]; then
  echo "Usage: CONFIRM_RESTORE=YES $0 <restic-restored-backup-directory>" >&2
  exit 2
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a
: "${SECRETS_DIR:=/etc/ai-agency/secrets}"

for file in \
  application-db.dump \
  n8n-db.dump \
  prometheus-volume.tar.gz \
  grafana-volume.tar.gz \
  loki-volume.tar.gz \
  alloy-volume.tar.gz; do
  if [[ ! -s "${BACKUP_DIR}/${file}" ]]; then
    echo "Backup file is missing or empty: ${BACKUP_DIR}/${file}" >&2
    exit 1
  fi
done
if [[ ! -s "${BACKUP_DIR}/host-config/secrets/n8n_encryption_key" ]]; then
  echo "The backup does not contain its n8n encryption key." >&2
  exit 1
fi
if [[ ! -r "${SECRETS_DIR}/n8n_encryption_key" ]] ||
  ! cmp -s "${BACKUP_DIR}/host-config/secrets/n8n_encryption_key" "${SECRETS_DIR}/n8n_encryption_key"; then
  echo "Install the backup's matching n8n encryption key in ${SECRETS_DIR} before restoring." >&2
  exit 1
fi

: "${POSTGRES_ADMIN_USER:?Set POSTGRES_ADMIN_USER in production.env}"
: "${APP_DB_NAME:?Set APP_DB_NAME in production.env}"
: "${APP_DB_USER:?Set APP_DB_USER in production.env}"
: "${N8N_DB_NAME:?Set N8N_DB_NAME in production.env}"
: "${N8N_DB_USER:?Set N8N_DB_USER in production.env}"

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

compose stop api n8n n8n-worker

restore_database() {
  local database="$1"
  local owner="$2"
  local dump="$3"
  local secret_name="$4"
  compose exec -T postgres sh -ec \
    'PGPASSWORD="$(cat /run/secrets/postgres_admin_password)" dropdb --if-exists -h 127.0.0.1 -U "$POSTGRES_USER" "$1" && PGPASSWORD="$(cat /run/secrets/postgres_admin_password)" createdb -h 127.0.0.1 -U "$POSTGRES_USER" -O "$2" "$1"' \
    sh "$database" "$owner"
  compose exec -T postgres sh -ec \
    'secret_name="$3"; PGPASSWORD="$(cat "/run/secrets/$secret_name")" pg_restore -h 127.0.0.1 -U "$2" -d "$1" --no-owner --no-acl -' \
    sh "$database" "$owner" "$secret_name" < "$dump"
}

restore_database "$APP_DB_NAME" "$APP_DB_USER" "${BACKUP_DIR}/application-db.dump" app_db_password
restore_database "$N8N_DB_NAME" "$N8N_DB_USER" "${BACKUP_DIR}/n8n-db.dump" n8n_db_password

restore_volume() {
  local service="$1"
  local destination="$2"
  local archive="$3"
  local container
  local volume

  container="$(compose ps -q "$service")"
  if [[ -z "$container" ]]; then
    echo "Container for ${service} is not created; start the production stack first." >&2
    return 1
  fi
  volume="$(docker inspect --format "{{range .Mounts}}{{if eq .Destination \"${destination}\"}}{{.Name}}{{end}}{{end}}" "$container")"
  if [[ -z "$volume" ]]; then
    echo "Could not resolve the ${service} volume mounted at ${destination}." >&2
    return 1
  fi

  compose stop "$service"
  docker run --rm \
    --volume "${volume}:/volume" \
    --volume "${BACKUP_DIR}:/backup:ro" \
    --entrypoint /bin/sh \
    postgres:16-alpine@sha256:721873c34ceb9f8d8fc265984940dc982404c105f19ad51be9fdc5970a6080ea \
    -ec 'find /volume -mindepth 1 -maxdepth 1 -exec rm -rf -- {} \; && tar -xzf "/backup/$1" -C /volume' \
    sh "$archive"
}

restore_volume prometheus /prometheus prometheus-volume.tar.gz
restore_volume grafana /var/lib/grafana grafana-volume.tar.gz
restore_volume loki /loki loki-volume.tar.gz
restore_volume alloy /var/lib/alloy alloy-volume.tar.gz

compose up -d --wait --wait-timeout 180
echo "Database restore completed. Verify the API, n8n workflows, and application smoke tests."
