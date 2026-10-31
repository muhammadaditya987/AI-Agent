# Production deployment guide

The supported production path is Ubuntu VPS + Docker Compose. The repository
contains deployment automation, but it is not live-ready until a real domain,
DNS, VPS, GHCR repository, TLS certificate, S3-compatible endpoint, and
operator-managed secret values are configured and verified.

Release operation documents:
[release notes](./RELEASE.md), [upgrade guide](./UPGRADE-GUIDE.md),
[rollback guide](./ROLLBACK-GUIDE.md), and
[production go-live checklist](./PRODUCTION-CHECKLIST.md).

## Ubuntu VPS deployment

### 1. Prepare the host

- Use a supported Ubuntu LTS release and a dedicated VPS.
- Configure the host firewall to allow inbound TCP 80/443 and SSH only from
  approved administration addresses.
- Install Docker Engine with the Compose plugin, Certbot, `restic`, `openssl`,
  and `curl` using the official Ubuntu/Docker installation guidance.
- Keep Docker rootful for this deployment. The root-owned secrets directory is
  mode `0700`; secret files are mounted into containers read-only.
- Create a deployment user with SSH access and narrowly scoped passwordless
  `sudo` for the deployment scripts. Do not expose the Docker socket to an
  application container.

### 2. Install deployment files and host configuration

Copy `compose.production.yml`, `infra/`, and `scripts/` into
`/opt/ai-agency/`. Set the shell scripts executable:

```bash
sudo chmod 0750 /opt/ai-agency/scripts/*.sh
sudo install -d -o root -g root -m 0700 /etc/ai-agency
sudo install -o root -g root -m 0600 \
  infra/deployment/production/production.env.example \
  /etc/ai-agency/production.env
sudo install -o root -g root -m 0600 \
  infra/deployment/production/backup.env.example \
  /etc/ai-agency/backup.env
```

Edit `/etc/ai-agency/production.env` with the actual DNS hostnames and
non-secret configuration. Never put passwords, API keys, or the n8n encryption
key in this file. Create random host secrets:

```bash
sudo bash /opt/ai-agency/scripts/init-production-secrets.sh
```

The script refuses to overwrite existing files. Set provider keys by securely
replacing `/etc/ai-agency/secrets/openai_api_key` and
`/etc/ai-agency/secrets/notion_api_key`; use a temporary root-only file and
atomic rename, then retain mode `0444`. The parent directory must remain
root-owned mode `0700`. This is a local Compose file-secret approach, not a
centralized secret manager; host root and the Docker daemon remain trusted.

Configure S3-compatible values in `/etc/ai-agency/backup.env` and create
`/etc/ai-agency/restic-password` as a root-owned mode-`0600` file. Store a
separate offline copy of the restic password; losing it makes the encrypted
backup repository unrecoverable.

### 3. Point DNS and issue TLS

Create A/AAAA records for `API_DOMAIN` and `N8N_DOMAIN` pointing to the VPS.
Allow inbound ports 80 and 443 and ensure no other service occupies them.
Install Certbot on the host and set `CERTBOT_EMAIL` in the protected
`production.env`. Request a certificate containing both names:

```bash
sudo bash /opt/ai-agency/scripts/init-production-tls.sh
```

The Nginx container mounts `/etc/letsencrypt` read-only. HTTP requests to the
configured domains redirect to HTTPS. The API and n8n are the only public
routes; Prometheus and Grafana bind to host loopback only.

### 4. Publish and deploy the API image

The GitHub workflow runs lint, type-check, tests, dependency audit, and Docker
build. A successful push to `main` publishes the API image to GHCR under an
immutable commit-SHA tag, then deploys it over SSH.

Configure GitHub repository secrets:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY` (dedicated deploy key)
- `DEPLOY_SSH_KNOWN_HOSTS` (verified host-key line; do not generate trust by
  blindly running `ssh-keyscan` in the workflow)

Configure GitHub repository variables:

- `DEPLOY_PATH=/opt/ai-agency`
- `API_DOMAIN=<the API hostname>`

The VPS must already have authenticated GHCR pull access if the package is
private. Use a narrowly scoped read-only package token stored in the host's
Docker credential store. CI credentials only publish the image; application
secrets remain on the host. The remote deploy script waits for Compose health
checks before reporting success.

For the first deployment, after configuration and image publication, run:

```bash
sudo APP_DIR=/opt/ai-agency bash \
  /opt/ai-agency/scripts/deploy-production.sh <40-character-commit-sha> <github-owner/repository>
```

The image is immutable by commit SHA. Avoid floating tags such as `latest`.

### 5. Enable encrypted scheduled backups and TLS renewal

Install `restic` and configure the S3-compatible endpoint and credentials in
the root-only `backup.env`. Initialize the encrypted repository once:

```bash
sudo bash -c '
  set -a
  . /etc/ai-agency/backup.env
  set +a
  restic -o "s3.endpoint=$S3_ENDPOINT" init
'
```

Run a first backup and verify a restic snapshot before enabling timers:

```bash
sudo bash /opt/ai-agency/scripts/backup-production.sh
sudo bash -c '
  set -a
  . /etc/ai-agency/backup.env
  set +a
  restic -o "s3.endpoint=$S3_ENDPOINT" snapshots
'
```

For backup verification, confirm the new `ai-agency` snapshot's host and
timestamp, then run a repository integrity check:

```bash
sudo bash -c '
  set -a
  . /etc/ai-agency/backup.env
  set +a
  restic -o "s3.endpoint=$S3_ENDPOINT" check
'
```

Repository checks do not prove recoverability. Periodically restore a selected
snapshot into an isolated staging host, inspect the PostgreSQL dumps with
`pg_restore --list`, verify archives, run the restore procedure there, and
execute the API/n8n health checks before recording the drill as successful.
Never perform a restore drill against the production databases.

Install and enable the provided systemd timers:

```bash
sudo install -m 0644 /opt/ai-agency/scripts/ai-agency-backup.service \
  /etc/systemd/system/
sudo install -m 0644 /opt/ai-agency/scripts/ai-agency-backup.timer \
  /etc/systemd/system/
sudo install -m 0644 /opt/ai-agency/scripts/ai-agency-certbot-renew.service \
  /etc/systemd/system/
sudo install -m 0644 /opt/ai-agency/scripts/ai-agency-certbot-renew.timer \
  /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ai-agency-backup.timer ai-agency-certbot-renew.timer
```

Backups include consistent PostgreSQL custom-format dumps, an n8n workflow
export, a Redis RDB snapshot, Prometheus/Grafana/Loki/Alloy named-volume
archives, and the host secret files required for recovery. Restic encrypts data
before upload. Observability services are briefly stopped to archive their
volumes. The PostgreSQL data directory is deliberately not copied live;
logical database dumps are the consistent backup. Restored Redis queue state
is not replayed, because queued jobs may be stale or duplicate work.

Loki retains logs for 30 days. Alloy tails Docker's `json-file` logs from
`DOCKER_LOG_DIR` (default `/var/lib/docker/containers`) without mounting the
Docker socket; Compose caps each service's local log files at five 10 MB files.
If Docker uses a non-default data root, set `DOCKER_LOG_DIR` accordingly.
Keep secrets and sensitive personal data out of application logs. Grafana and
Loki are private to the host/administration network; log access is sensitive.

### 6. Verify, monitor, and operate

```bash
cd /opt/ai-agency
sudo docker compose --env-file /etc/ai-agency/production.env \
  -f compose.production.yml ps
sudo bash scripts/smoke-production.sh https://<API_DOMAIN>
```

For additional same-host capacity, Compose can run multiple stateless API and
n8n worker replicas:

```bash
sudo docker compose --env-file /etc/ai-agency/production.env \
  -f compose.production.yml up -d --scale api=2 api
sudo docker compose --env-file /etc/ai-agency/production.env \
  -f compose.production.yml up -d --scale n8n-worker=2 n8n-worker
```

Nginx resolves API replicas dynamically. Each API replica can open up to 10
PostgreSQL connections, so include the replica count when sizing the database.
The API has a 130-second stop grace period for requests allowed to run up to
120 seconds; deployments and manual stops should allow that graceful interval.
These settings improve same-host continuity only: PostgreSQL, Redis, Nginx, and
the host remain single points of failure, so this is not high availability.

Open Grafana through an SSH tunnel, not the public internet:

```bash
ssh -L 3002:127.0.0.1:3002 -L 3100:127.0.0.1:3100 <deploy-user>@<vps>
```

Then open `http://localhost:3002` and use the Grafana password from
`/etc/ai-agency/secrets/grafana_admin_password`. Prometheus is available
privately through the same method on port `9090`. Alert rules are evaluated
inside Prometheus, but no Alertmanager receiver or notification channel is
configured. The provisioned **AI Agency Production Logs** dashboard queries
Docker container logs in Loki; Loki itself is also private on port `3100`.

Complete n8n's initial owner setup, enforce a unique administrator account
and strong password, import the reviewed workflow template, and configure its
internal API Header Auth credential before activating any workflow. Keep
unreviewed or externally triggered workflows inactive.

## Rollback

Deploy the previous known-good immutable image SHA; do not roll back by
changing a floating tag:

```bash
sudo APP_DIR=/opt/ai-agency bash \
  /opt/ai-agency/scripts/deploy-production.sh <previous-40-character-sha> <github-owner/repository>
```

If the release includes a database schema change, restore the pre-deployment
backup before rolling back unless that migration is explicitly backward
compatible. There are currently no application migrations; do not assume that
database rollback will always be safe after future schema changes.

## Restore

Restore an encrypted snapshot to a protected temporary directory:

```bash
sudo bash -c '
  set -a
  . /etc/ai-agency/backup.env
  set +a
  restic -o "s3.endpoint=$S3_ENDPOINT" restore latest --target /var/tmp/ai-agency-restore
'
```

Find the restored backup directory containing `application-db.dump` and
`n8n-db.dump`, inspect its timestamp and contents, and ensure the corresponding
host secrets (especially the unchanged n8n encryption key) are installed before
restarting n8n. Then explicitly confirm the destructive database restore:

```bash
sudo CONFIRM_RESTORE=YES bash \
  /opt/ai-agency/scripts/restore-production.sh <restored-backup-directory>
```

The restore script stops API/n8n, replaces both PostgreSQL databases, restores
the Prometheus, Grafana, Loki, and Alloy named volumes, and waits for service
health. Perform this procedure in a staging environment at least once before
treating the backup as production recovery.

## Railway, Render, and AWS

- **Railway / Render:** The API container can be built from
  `infra/docker/api.Dockerfile`, but the complete platform also requires
  PostgreSQL, Redis, n8n queue mode, and persistent volumes. Provision those
  dependencies separately, map the same environment/secret contract, and
  configure HTTPS ingress before exposing the API. This repository does not
  contain provider-specific deployment manifests or validated live deployment
  workflows for these platforms.
- **AWS:** The Compose deployment can run on an EC2 Ubuntu host. For managed
  production, evaluate RDS PostgreSQL, ElastiCache Redis, S3 with a dedicated
  backup role, and a managed ingress/load balancer; adapt network rules and
  secret handling before migrating. AWS-specific infrastructure-as-code is
  not included.

Do not claim production readiness until the actual domain, TLS, host,
container health, secret rotation, S3 backup, and a full restore drill have
been verified.
