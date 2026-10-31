# AI Agency Platform — v1.0.0

Sprint 1 provides the Docker-based development environment, PostgreSQL, Redis, n8n, and a TypeScript/NestJS API with liveness and dependency readiness checks. Sprint 2 adds the AI Content Factory integration endpoints and an importable n8n workflow. Sprint 3A adds Prometheus metrics and a provisioned Grafana dashboard. WhatsApp remains dry-run only; no WhatsApp API request is made.

## Requirements

- Docker Desktop with Docker Compose
- Node.js 22 or later and npm 10 or later for running the API outside Docker

## Start the stack

1. Copy `.env.example` to `.env`.
2. Replace all placeholder passwords and the n8n encryption key with local development values. Use a securely generated encryption key of at least 32 characters. Do not reuse these values in shared or production environments.
3. From the repository root, start the services:

   ```powershell
   docker compose up -d --build
   ```

4. Open n8n at `http://localhost:5678`. The API is at `http://localhost:3000` unless `API_PORT` in `.env` is changed to avoid a host-port conflict.

`POSTGRES_PORT` and `REDIS_PORT` control the host-side ports for PostgreSQL and Redis (defaults `5432` and `6379`). The local environment may use alternate values when another project already occupies those ports; containers continue using their standard internal ports.

The Compose stack contains:

- `api`: NestJS API.
- `postgres`: PostgreSQL 16. The initialization script creates separate application and n8n databases/users on first initialization.
- `redis`: Redis with authentication. Database 0 is reserved for the platform API and database 1 is used by n8n queue mode.
- `n8n`: n8n main/editor process.
- `n8n-worker`: n8n worker process.
- `postgres-exporter` and `redis-exporter`: expose PostgreSQL and Redis metrics inside the private Compose network.
- `prometheus`: scrapes API, n8n, PostgreSQL exporter, and Redis exporter every 15 seconds with seven days of local metric retention.
- `grafana`: provisions the Prometheus datasource and AI Agency API dashboard automatically.

## Monitoring (Sprint 3A)

- API metrics: `http://localhost:${API_PORT:-3000}/metrics` (Prometheus exposition format; intentionally outside `/api/v1`).
- Prometheus: `http://localhost:${PROMETHEUS_PORT:-9090}`. Open `/targets` to see scrape health or query a metric in the expression bar, for example `rate(ai_agency_http_requests_total[5m])`.
- Grafana: `http://localhost:${GRAFANA_PORT:-3002}`; sign in using `GRAFANA_ADMIN_USER` and `GRAFANA_ADMIN_PASSWORD` from the ignored local `.env`.
- The **AI Agency API** dashboard is provisioned in the **AI Agency** folder. It shows request rate, 5xx ratio, p95 request duration, API CPU, resident memory, heap use, event-loop utilization, scrape health for all monitored services, PostgreSQL connections, and Redis memory.
- In PowerShell, inspect the raw API metrics with `Invoke-WebRequest http://localhost:3001/metrics` (replace `3001` with `API_PORT` from `.env`). Prometheus scrapes API, n8n, PostgreSQL exporter, and Redis exporter.
- HTTP metrics use route templates (not raw URL paths) to avoid high-cardinality labels. The scrape endpoint is excluded from request counters.
- Prometheus and Grafana bind to localhost. Dashboard state and Prometheus data use named local Docker volumes.
- Sprint 3A itself adds metrics only. The separate production deployment templates below add Loki/Alloy log collection, deployment, and backup procedures; they do not add retry behavior.

The application database is not yet migrated to the full Database Design. Sprint 1 only verifies connectivity; domain persistence will be introduced in a later sprint.
The n8n image is pinned by digest in `.env.example`; update `N8N_IMAGE` only to a reviewed tag/digest.

## Sprint 2 integrations

Set these values in the ignored local `.env` file:

- `AUTOMATION_SHARED_TOKEN`: random value with at least 32 characters. In n8n, create one **Header Auth** credential with header `x-automation-token` and the same value, then attach it to the three platform API request nodes.
- `OPENAI_API_KEY`: OpenAI API key. Keep it only in local environment/secret manager.
- `OPENAI_MODEL`: defaults to `gpt-4o-mini`.
- `NOTION_API_KEY`: Notion integration token.
- `NOTION_PARENT_PAGE_ID`: UUID of a Notion parent page shared with the integration. The workflow creates one child page per song project.
- `WHATSAPP_DRY_RUN=true`: keep this value. Sprint 2 has no live WhatsApp sender implementation.
- `WHATSAPP_ALLOWED_RECIPIENT`: the single approved Indonesian mobile recipient in international or national format. The backend normalizes the number and does not accept a recipient from the workflow request.

The Notion integration needs permission to insert content on the configured parent page. Without OpenAI or Notion credentials the relevant endpoint returns an explicit `503` and the n8n execution follows its failure branch. No successful project notification is produced unless Notion page creation succeeds.

### Import the n8n workflow

1. Start the stack and finish initial n8n owner setup.
2. Import `n8n/exports/templates/ai-content-factory.json`.
3. Create the internal API Header Auth credential described above and select it on all four HTTP Request nodes.
4. Configure the local API `.env`, restart the API service, and verify n8n can reach `http://api:3000`.
5. Test using the n8n Form Trigger test URL. The input form asks for Keyword, Target Usia, and Bahasa.
6. Confirm the Notion project is created and inspect the WhatsApp preview output. Keep the workflow inactive until configuration and output are reviewed.

Workflow outputs include title, song idea, lyrics, Suno prompt, Google Flow prompt, thumbnail prompt, YouTube description, SEO keywords, hashtags, and estimated duration. Prompt template version is maintained in the API code.

The recipient allowlist is configured server-side and never supplied by the form. Both success and failure branches call a preview-only endpoint. The response includes `sent: false`; no WhatsApp provider token/endpoint is configured or called by Sprint 2. Error branches identify OpenAI generation or Notion page creation as the failing stage.

## Health endpoints

| Endpoint | Purpose | Healthy status |
|---|---|---|
| `GET /api/v1/health/live` | Confirms that the API process is responsive. | `200 OK` |
| `GET /api/v1/health/ready` | Checks PostgreSQL, Redis, and n8n readiness. | `200 OK` when all dependencies pass; `503 Service Unavailable` otherwise. |

Example readiness response:

```json
{
  "status": "ok",
  "checks": {
    "postgres": "ok",
    "redis": "ok",
    "n8n": "ok"
  },
  "timestamp": "2026-10-31T02:00:00.000Z"
}
```

The readiness endpoint returns dependency status only and does not expose connection errors or credentials. Liveness does not depend on external services so an upstream outage does not cause an unnecessary API restart.

## Run the API locally

Install workspace dependencies and start the development server from the repository root:

```powershell
npm install
npm run dev
```

When running outside Compose, set the API environment variables in the root `.env`; use `postgres`/`redis` hostnames only from containers. For a host-run API, set `DATABASE_HOST=localhost`, `REDIS_HOST=localhost`, and `N8N_BASE_URL=http://localhost:5678`.

Build and type-check:

```powershell
npm run build
npm run typecheck
npm test
```

## Data reset

PostgreSQL and Redis data are stored in named Docker volumes. Initialization scripts run only when the PostgreSQL data directory is empty. To reinitialize a local development environment, stop the stack and remove only its named volumes with an explicitly reviewed Compose command. This permanently deletes local database/queue data.

## Production deployment templates

The development stack remains `docker-compose.yml`. A separate Ubuntu VPS deployment is described in [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) and uses `compose.production.yml`; it does not change the local Sprint 1–3 stack.

The production topology includes a private PostgreSQL/Redis network, API/n8n outbound network, Nginx TLS ingress, host-mounted secret files, Prometheus/Grafana monitoring, Loki/Alloy log collection, provisioned alert rules and dashboards, GHCR image publishing/deployment workflow, encrypted restic backups to S3-compatible storage, systemd timers, restore and smoke-test scripts.

Before deploying, configure a real domain and DNS, `/etc/ai-agency/production.env`, host secrets, TLS, GHCR access, and S3-compatible backup credentials as documented in [ENVIRONMENT-GUIDE.md](./ENVIRONMENT-GUIDE.md). Never commit or paste production credentials into GitHub workflow YAML or image build arguments.

Production operational guidance:

- [CHANGELOG.md](./CHANGELOG.md) — release history.
- [RELEASE.md](./RELEASE.md) — v1.0.0 scope, release status, and notes.
- [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) — VPS setup, CI/CD, TLS, backup/restore, rollback, and cloud alternatives.
- [UPGRADE-GUIDE.md](./UPGRADE-GUIDE.md) — controlled upgrade and post-upgrade verification.
- [ROLLBACK-GUIDE.md](./ROLLBACK-GUIDE.md) — image rollback and data restore distinctions.
- [PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md) — production go-live gates and verification record.
- [ENVIRONMENT-GUIDE.md](./ENVIRONMENT-GUIDE.md) — documented production variables and host secret files.
- [TROUBLESHOOTING-GUIDE.md](./TROUBLESHOOTING-GUIDE.md) — Compose, TLS, GHCR, database, monitoring, and recovery.
- [API-DESIGN.md](./API-DESIGN.md) — API target contract and current deployed endpoints.

## Production readiness limitations

- These are deployable templates, not a live/verified production system. No domain, DNS, VPS credentials, GHCR settings, S3 endpoint, or live provider credentials have been supplied or tested.
- The running API implements only the internal Content Factory endpoints; the multi-tenant identity, RBAC, billing, and broader API described in design documents are not implemented. Review that scope before public exposure.
- Production API and n8n images are pinned to immutable digests/tags, but image vulnerability scanning and automatic OS/base-image updates are not configured.
- The deployment is single-host Compose, not Kubernetes or high availability. The n8n worker health check verifies its metrics endpoint; monitor actual queue execution and worker logs before relying on automated recovery.
- Prometheus alert rules evaluate, but no Alertmanager destination is configured. Loki provides 30-day centralized log retention/search; Alloy reads the host Docker `json-file` logs without Docker socket access. Ensure logs do not contain secrets or sensitive personal data.
- The backup script uses encrypted restic snapshots and includes PostgreSQL logical dumps, n8n workflows, Redis RDB, Prometheus/Grafana/Loki/Alloy volumes, and host secrets. A full restore drill and S3 compatibility must be verified by the operator before production use.
- Railway, Render, and AWS guidance is provided as an adaptation path; provider-specific infrastructure and live deployment workflows are not included.
- Review the n8n license/edition and commercial deployment model before offering this platform as a service.
