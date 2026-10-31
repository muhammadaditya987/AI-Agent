# Changelog

Notable changes for this project are documented here. Dates use ISO 8601.

## [1.0.0] - 2026-10-31

### Added

- Docker Compose development environment with PostgreSQL, Redis, n8n, and a
  NestJS API with liveness and dependency-readiness endpoints.
- Internal Content Factory API integration for structured OpenAI generation,
  Notion project creation, and WhatsApp preview-only responses.
- An importable n8n content-factory workflow with authenticated internal API
  requests and failure-path handling.
- Prometheus API/Node.js/process metrics and provisioned Grafana dashboards.
- Ubuntu VPS deployment templates with Nginx TLS ingress, file-mounted secrets,
  health checks, pinned container images, and GitHub Actions build/deploy flow.
- Restic-based encrypted backup scripts, restore scripts, scheduled systemd
  units, monitoring/log collection templates, and operational documentation.
- Release, upgrade, rollback, and production checklist documentation.

### Security and operations

- Internal automation routes require the configured shared token.
- WhatsApp remains dry-run/preview-only; no live WhatsApp send is implemented.
- Prometheus and Grafana are intended to remain private to the host/admin
  network.
- Production deployment templates use a single-host Docker Compose topology;
  they do not provide high availability.

### Known limitations

- No live production deployment, real-domain TLS, provider integration,
  production backup, or restore drill was performed for this release.
- Multi-tenant authentication, user-facing RBAC, and billing are not part of
  the implemented API.
- No Alertmanager notification receiver is configured.
- The production backup and restore runbooks require operator verification
  against the actual S3-compatible repository and a staging restore.
- This changelog describes implemented repository scope; design documents may
  describe future capabilities that are not present in the running API.
