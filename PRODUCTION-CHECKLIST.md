# Production checklist

Use this checklist for each initial go-live and material release. Do not mark
an item complete based only on repository configuration; retain evidence from
the actual production environment.

## Release and supply chain

- [ ] Reviewed source commit is recorded and protected.
- [ ] CI lint, typecheck, unit/integration tests, dependency audit, image build,
  Compose validation, and monitoring configuration validation pass on that
  commit.
- [ ] Image is published under an immutable commit SHA; scan results and
  artifact digest are retained.
- [ ] Release tag `v1.0.0` is created and pushed in the authoritative Git
  repository. (Not created in this workspace; it is not a Git repository.)
- [ ] Production API scope is approved. Multi-tenant identity, user RBAC,
  billing, and other design-only capabilities are not assumed to be present.

## Host, secrets, and network

- [ ] Ubuntu LTS host is patched, access is restricted, firewall permits only
  required SSH/HTTP/HTTPS, and Docker/Compose versions are supported.
- [ ] DNS, A/AAAA records, API and n8n hostnames, and inbound routing are
  verified.
- [ ] Production environment file and secret directory have restrictive
  ownership/permissions; all secrets are unique, backed up securely, and not
  stored in Git, image layers, or CI logs.
- [ ] TLS certificate covers configured hostnames; HTTP redirects to HTTPS;
  renewal timer and renewal procedure are tested.
- [ ] Prometheus, Grafana, and Loki are not publicly reachable; admin access
  uses an approved private path.
- [ ] Production egress, provider credentials, privacy requirements, and
  service terms have been reviewed.

## Backup and recovery

- [ ] Restic repository is initialized at the intended S3-compatible endpoint
  and credentials are least-privilege.
- [ ] Restic encryption password has an offline escrow copy with controlled
  access.
- [ ] A production backup completed and its snapshot is visible with the
  expected tag/host/time.
- [ ] Backup contents and permissions are checked; retention and available
  storage are reviewed.
- [ ] A restore drill has succeeded in isolated staging, including database
  dumps, n8n encryption key/workflows, and observability state.
- [ ] Recovery time, recovery point, Redis queue loss behavior, and owner are
  documented and accepted.
- [ ] Backup timer is enabled and a failure alert/operational review process is
  assigned.

**Current evidence:** no production restic repository or secrets were
available in this workspace. Backup completion, snapshot integrity, and restore
drill remain **unverified**.

## Health and monitoring

- [ ] `docker compose ... ps` shows all required services healthy/running.
- [ ] Public HTTPS liveness and readiness checks pass.
- [ ] `scripts/smoke-production.sh https://<API_DOMAIN>` passes.
- [ ] `/metrics` is reachable only from the intended private scrape path and
  not exposed by the public ingress.
- [ ] Prometheus targets and alert rules are active; alert notifications have
  an explicitly tested receiver or an accepted manual response process.
- [ ] Grafana dashboards show current API, database, Redis, n8n, and host data.
- [ ] Logs are arriving and have been checked for secret/PII exposure.
- [ ] Restart/shutdown behavior, queue recovery, and resource alarms are
  verified on the actual host.

**Current evidence:** production Docker daemon, DNS, TLS endpoint, and
credentials were unavailable in this workspace. Live health verification
remains **unverified**.

## Application and operational readiness

- [ ] OpenAI/Notion credentials and permissions are validated using approved
  test resources and cost limits.
- [ ] WhatsApp dry-run behavior is understood; no live send is expected.
- [ ] A representative n8n workflow succeeds, fails safely, and does not
  create duplicate side effects on re-execution.
- [ ] Capacity limits, database connection budget, host CPU/RAM/disk, and
  expected load have been approved.
- [ ] On-call owner, escalation path, maintenance window, and incident
  communication are assigned.
- [ ] Upgrade and rollback procedures have been rehearsed with the selected
  immutable image SHA.
- [ ] Single-host Compose limitations and lack of high availability are
  explicitly accepted, or a multi-host HA architecture is deployed.

## Go/no-go

- [ ] All required gates above have evidence attached.
- [ ] Any unchecked item has an owner, mitigation, and explicit risk
  acceptance.
- [ ] Release and operations owner approve production go-live.

**Workspace status:** Documentation and package version metadata are prepared
for v1.0.0. Git tag creation, production backup/restore verification, and live
health verification are not complete here. Do not treat this checklist as a
production sign-off.
