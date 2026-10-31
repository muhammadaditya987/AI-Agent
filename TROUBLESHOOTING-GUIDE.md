# Troubleshooting guide

Run commands from `/opt/ai-agency` on the VPS. Production values are in
`/etc/ai-agency/production.env`; do not print secret files or include them in
support logs.

## Compose configuration and service status

```bash
sudo docker compose --env-file /etc/ai-agency/production.env \
  -f compose.production.yml config --quiet
sudo docker compose --env-file /etc/ai-agency/production.env \
  -f compose.production.yml ps
sudo docker compose --env-file /etc/ai-agency/production.env \
  -f compose.production.yml logs --tail=100 <service>
```

An API or n8n unhealthy state usually means a dependency is unavailable, the
database/Redis credentials do not match the initialized database, or the n8n
encryption key was changed. Do not remove named volumes to "fix" readiness.

## TLS and reverse proxy

- Check `API_DOMAIN` and `N8N_DOMAIN` resolve to the VPS and ports 80/443 are
  reachable.
- Check certificate files exist under
  `/etc/letsencrypt/live/<API_DOMAIN>/`.
- Inspect `sudo systemctl status ai-agency-certbot-renew.timer` and
  `sudo journalctl -u ai-agency-certbot-renew.service`.
- Nginx is unavailable if the certificate is missing or renewal failed.
  Bootstrap a certificate before starting the production Compose stack.
- Nginx routes only the configured API and n8n hostnames; other HTTP hosts
  receive 404.

## GHCR deployment failures

- Verify the immutable image SHA exists and the package is visible to the VPS.
- Confirm Docker on the VPS has read-only GHCR credentials if the package is
  private.
- Review the failed GitHub Actions job and host's Docker Compose logs. Do not
  print the SSH private key or GHCR token.
- Roll back by deploying a known-good prior commit SHA with
  `scripts/deploy-production.sh`.

## Database and Redis

- PostgreSQL readiness: `pg_isready` is part of the container health check.
- Redis readiness: the health check reads the mounted password file and sends
  `PING`; never use `redis-cli -a <password>` in shell history.
- Database init scripts run only for an empty PostgreSQL data directory.
  Changing a password file alone does not rotate a role password in an
  existing database.
- Review backups before any destructive recovery; follow the restore guide and
  set `CONFIRM_RESTORE=YES` only after verifying the selected snapshot.

## Monitoring

Prometheus, Grafana, and Loki bind to host loopback. Use an SSH tunnel to
access ports 9090, 3002, and 3100. The API/n8n/Loki/Alloy targets and alert
rules are visible in Prometheus; the alerts are not delivered to an external
notification receiver.

- If logs are missing from Grafana's **AI Agency Production Logs** dashboard,
  verify the Alloy target is `up`, `DOCKER_LOG_DIR` points to the host's
  Docker `json-file` directory, and Docker is using the configured `json-file`
  logging driver.
- Inspect Alloy diagnostics with
  `sudo docker compose --env-file /etc/ai-agency/production.env -f compose.production.yml logs --tail=100 alloy`.
- Alloy has read-only access to the Docker log directory and does not mount
  `/var/run/docker.sock`; its persistent volume stores tail positions.

## Backup and restore

- Check `sudo systemctl status ai-agency-backup.timer` and
  `sudo journalctl -u ai-agency-backup.service`.
- Verify S3 endpoint, restricted credentials, repository initialization, and
  offline restic password escrow.
- `scripts/backup-production.sh` briefly stops Prometheus, Grafana, Loki, and
  Alloy while archiving their named volumes. API, n8n, and PostgreSQL remain
  running.
- Test restore from an encrypted snapshot in staging. Database dumps do not
  replace the need to keep database passwords and the n8n encryption key
  consistent with the backed-up state.

## Public health checks

```bash
bash scripts/smoke-production.sh https://<API_DOMAIN>
```

This checks API liveness, readiness, and the Prometheus exposition endpoint.
It does not call OpenAI, Notion, WhatsApp, or other paid/external providers.
