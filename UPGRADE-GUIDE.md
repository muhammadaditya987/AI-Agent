# Upgrade guide

Use this procedure for an existing Ubuntu VPS deployment. Run commands from the
deployment host, and do not print secret values into terminal logs or support
records.

## Before upgrading

1. Schedule a maintenance window and notify operators.
2. Record the currently deployed immutable API image/tag and the release commit
   SHA.
3. Review the release notes and confirm that no database migration or
   environment change is required. v1.0.0 includes no production schema
   migration.
4. Verify free disk space, host time, TLS certificate validity, DNS, and the
   current Compose service health.
5. Run the production backup script and confirm that the resulting snapshot is
   visible in the configured restic repository:

   ```bash
   sudo bash /opt/ai-agency/scripts/backup-production.sh
   sudo bash -c '
     set -a
     . /etc/ai-agency/backup.env
     set +a
     restic -o "s3.endpoint=$S3_ENDPOINT" snapshots --tag ai-agency
   '
   ```

   A successful backup command/snapshot listing is not a restore test. Restore
   a recent snapshot in an isolated staging environment before first
   production use and periodically thereafter.
6. Confirm that the release image has been built, scanned according to
   organization policy, and published under an immutable commit-SHA tag.

## Deploy

Use the reviewed commit SHA and repository:

```bash
sudo APP_DIR=/opt/ai-agency \
  bash /opt/ai-agency/scripts/deploy-production.sh \
  <40-character-commit-sha> <github-owner/repository>
```

The script pulls the API image and waits for Compose health checks before it
updates `API_IMAGE` in the protected production environment file. Do not
manually change `API_IMAGE` to a floating tag.

## Verify after upgrade

```bash
cd /opt/ai-agency
sudo docker compose --env-file /etc/ai-agency/production.env \
  -f compose.production.yml config --quiet
sudo docker compose --env-file /etc/ai-agency/production.env \
  -f compose.production.yml ps
sudo bash scripts/smoke-production.sh https://<API_DOMAIN>
```

Also verify in the private monitoring interface:

- Prometheus targets are up and recent samples are being ingested.
- Grafana dashboards load and service panels show current data.
- Loki/Alloy are healthy and new logs arrive without secrets or sensitive data.
- A controlled n8n test workflow completes and the failure path is observable.
- TLS renewal timer and backup timer are active.

The smoke script checks API liveness/readiness and API metrics. It does not
exercise OpenAI, Notion, WhatsApp, billing, or a full end-to-end production
workflow.

If any health or smoke check fails, stop rollout and follow the
[rollback guide](./ROLLBACK-GUIDE.md). Preserve logs and the previous image
reference without exposing secrets.
