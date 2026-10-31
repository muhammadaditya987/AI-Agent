#!/bin/sh
set -eu

if [ -n "${APP_DB_PASSWORD_FILE:-}" ]; then
  APP_DB_PASSWORD=$(cat "$APP_DB_PASSWORD_FILE")
fi

if [ -n "${N8N_DB_PASSWORD_FILE:-}" ]; then
  N8N_DB_PASSWORD=$(cat "$N8N_DB_PASSWORD_FILE")
fi

: "${APP_DB_PASSWORD:?APP_DB_PASSWORD or APP_DB_PASSWORD_FILE is required}"
: "${N8N_DB_PASSWORD:?N8N_DB_PASSWORD or N8N_DB_PASSWORD_FILE is required}"

psql \
  --set=ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set=app_user="$APP_DB_USER" \
  --set=app_password="$APP_DB_PASSWORD" \
  --set=app_db="$APP_DB_NAME" \
  --set=n8n_user="$N8N_DB_USER" \
  --set=n8n_password="$N8N_DB_PASSWORD" \
  --set=n8n_db="$N8N_DB_NAME" <<'SQL'
CREATE ROLE :"app_user" LOGIN PASSWORD :'app_password';
CREATE DATABASE :"app_db" OWNER :"app_user";

CREATE ROLE :"n8n_user" LOGIN PASSWORD :'n8n_password';
CREATE DATABASE :"n8n_db" OWNER :"n8n_user";
SQL
