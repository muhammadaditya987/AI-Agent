# Environment and secret guide

## Local development

Copy `.env.example` to `.env` for the development Compose stack. Its placeholder
values are local-only. Keep `.env` out of source control. The local Compose
stack injects development credentials into service environments; do not reuse
that pattern or those values for shared/production systems.

## Production non-secret configuration

Create `/etc/ai-agency/production.env` from
`infra/deployment/production/production.env.example`, set it to root-owned
mode `0600`, and replace example domains and the placeholder API image. These
values are required:

| Variable | Required | Purpose |
|---|---:|---|
| `API_DOMAIN` | Yes | Public HTTPS API hostname and certificate SAN. |
| `N8N_DOMAIN` | Yes | Public HTTPS n8n hostname and certificate SAN. |
| `CERTBOT_EMAIL` | Yes for TLS bootstrap | Let's Encrypt account/renewal contact. |
| `SECRETS_DIR` | Yes | Root-only host directory mounted as Compose secrets. |
| `LETSENCRYPT_DIR` | No | Host certificate directory (default `/etc/letsencrypt`). |
| `API_IMAGE` | Yes | Immutable GHCR API image tag; deployment script updates it. |
| `N8N_IMAGE` | Yes | Reviewed n8n image tag and digest. |
| `POSTGRES_ADMIN_USER` | No | PostgreSQL bootstrap administrator name. |
| `APP_DB_NAME`, `APP_DB_USER` | No | Platform database and role. |
| `N8N_DB_NAME`, `N8N_DB_USER` | No | n8n database and role. |
| `GRAFANA_ADMIN_USER` | No | Grafana administrator username. |
| `OPENAI_MODEL`, `OPENAI_TIMEOUT_MS` | No | AI service configuration. |
| `NOTION_PARENT_PAGE_ID`, `NOTION_API_VERSION`, `NOTION_TIMEOUT_MS` | No | Notion configuration. |
| `WHATSAPP_ALLOWED_RECIPIENT` | No | Preview-only recipient allowlist; sending remains dry-run. |
| `PROMETHEUS_PORT`, `GRAFANA_PORT` | No | Host-loopback ports for private admin access. |
| `LOKI_PORT` | No | Host-loopback port for private Loki access (default `3100`). |
| `DOCKER_LOG_DIR` | No | Host Docker `json-file` log directory (default `/var/lib/docker/containers`). |
| `HTTP_PORT`, `HTTPS_PORT` | No | Public Nginx ports (default 80/443). |
| `PROMETHEUS_RETENTION` | No | Prometheus retention (default `15d`). |

Database names and usernames are non-secret values but should remain stable
after first initialization. PostgreSQL init scripts do not rerun against an
existing data volume.

## Production secret files

Create the secret files with `scripts/init-production-secrets.sh`. The parent
directory is root-owned mode `0700`; Docker Compose mounts individual files
read-only. Keep every generated secret stable unless executing a coordinated
rotation:

| File in `SECRETS_DIR` | Consumer |
|---|---|
| `postgres_admin_password` | PostgreSQL bootstrap administrator. |
| `app_db_password` | Platform PostgreSQL role and API. |
| `n8n_db_password` | n8n PostgreSQL role and n8n main/worker. |
| `redis_password` | Redis, API, n8n main/worker, and backup snapshot command. |
| `redis.conf` | Redis authentication configuration generated from the Redis password. |
| `n8n_encryption_key` | n8n credential encryption; losing or changing it can make stored credentials unreadable. |
| `automation_shared_token` | API-to-n8n internal automation authentication. |
| `grafana_admin_password` | Grafana administrator. |
| `openai_api_key` | Optional OpenAI provider key; empty disables the integration. |
| `notion_api_key` | Optional Notion provider key; empty disables the integration. |

Do not place secret values in GitHub variables, workflow logs, image build
arguments, or the production environment file. GitHub Actions uses only its
built-in package-publish token plus the SSH deployment key; provider secrets
stay on the host. The host's GHCR read token and S3 credentials must be
restricted, rotated, and excluded from backups unless protected by restic
encryption. Restic's repository password must be separately escrowed offline.

## Backup configuration

Store `infra/deployment/production/backup.env.example` as
`/etc/ai-agency/backup.env` with mode `0600`, replacing every placeholder. It
contains `RESTIC_REPOSITORY`, `RESTIC_PASSWORD_FILE`, `S3_ENDPOINT`,
`AWS_DEFAULT_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.
Restrict the S3 identity to the backup bucket/prefix and TLS endpoint.

## GitHub deployment settings

Repository secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, and
`DEPLOY_SSH_KNOWN_HOSTS`.

Repository variables: `DEPLOY_PATH` (safe absolute path, normally
`/opt/ai-agency`) and `API_DOMAIN`.

The VPS must have read-only GHCR access for private packages. Do not paste the
package token into workflow YAML or pass it as a command-line argument.
