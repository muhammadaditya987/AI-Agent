#!/usr/bin/env bash
set -euo pipefail

SECRETS_DIR="${SECRETS_DIR:-/etc/ai-agency/secrets}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi

install -d -o root -g root -m 0700 "$SECRETS_DIR"

write_secret() {
  local name="$1"
  local value="$2"
  local temporary="${SECRETS_DIR}/.${name}.tmp"
  printf '%s' "$value" > "$temporary"
  chmod 0444 "$temporary"
  mv "$temporary" "${SECRETS_DIR}/${name}"
}

random_secret() {
  openssl rand -hex 32
}

for name in \
  postgres_admin_password \
  app_db_password \
  n8n_db_password \
  redis_password \
  n8n_encryption_key \
  automation_shared_token \
  grafana_admin_password \
  openai_api_key \
  notion_api_key \
  redis.conf; do
  if [[ -e "${SECRETS_DIR}/${name}" ]]; then
    echo "Refusing to overwrite existing secret: ${SECRETS_DIR}/${name}" >&2
    exit 1
  fi
done

write_secret postgres_admin_password "$(random_secret)"
write_secret app_db_password "$(random_secret)"
write_secret n8n_db_password "$(random_secret)"
write_secret redis_password "$(random_secret)"
write_secret n8n_encryption_key "$(random_secret)"
write_secret automation_shared_token "$(random_secret)"
write_secret grafana_admin_password "$(random_secret)"
write_secret openai_api_key ""
write_secret notion_api_key ""

{
  printf 'requirepass %s\n' "$(cat "${SECRETS_DIR}/redis_password")"
} > "${SECRETS_DIR}/redis.conf"
chmod 0444 "${SECRETS_DIR}/redis.conf"

echo "Secret files created in ${SECRETS_DIR}."
echo "Add provider keys by securely replacing openai_api_key and notion_api_key."
echo "The directory is root-only; Docker must use the rootful daemon to mount these files."
