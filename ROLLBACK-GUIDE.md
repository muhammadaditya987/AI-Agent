# Rollback guide

Rollback the application image first. Restore databases only when the failure
requires data recovery; a database restore is destructive and must not be used
as a routine code rollback.

## Application image rollback

1. Identify the last known-good 40-character commit SHA from the deployment
   record.
2. Confirm that the corresponding immutable GHCR image is available.
3. Deploy that SHA:

   ```bash
   sudo APP_DIR=/opt/ai-agency \
     bash /opt/ai-agency/scripts/deploy-production.sh \
     <previous-40-character-commit-sha> <github-owner/repository>
   ```

4. Wait for the Compose health checks, then verify:

   ```bash
   sudo docker compose --env-file /etc/ai-agency/production.env \
     -f compose.production.yml ps
   sudo bash /opt/ai-agency/scripts/smoke-production.sh \
     https://<API_DOMAIN>
   ```

5. Check Prometheus targets and application/ingress logs. Confirm that
   `API_IMAGE` in `/etc/ai-agency/production.env` now identifies the known-good
   image.

The deployment script waits for health before writing the new image reference
to the environment file. If an attempted deployment fails, inspect the
Compose state and explicitly redeploy the previous SHA; do not assume that
Compose automatically restored the previous containers.

## Database and configuration restore

Only restore after declaring an incident, identifying the correct snapshot,
and obtaining explicit operator approval. The restore script replaces both
application and n8n databases and restores observability volumes:

```bash
sudo APP_DIR=/opt/ai-agency \
  CONFIRM_RESTORE=YES \
  bash /opt/ai-agency/scripts/restore-production.sh \
  <verified-restic-restored-directory>
```

Before running it:

- Verify the backup files and snapshot timestamp.
- Ensure the matching n8n encryption key is installed. The script refuses a
  mismatched key.
- Verify database names/users and the intended Compose environment.
- Stop writes and capture a fresh pre-restore backup if the current data is
  still accessible.
- Restore the selected restic snapshot to a protected temporary directory;
  keep permissions restrictive and remove temporary plaintext data after
  verification.

The restore script stops API, n8n, and workers, replaces both databases, and
restores Prometheus, Grafana, Loki, and Alloy volumes. It does not restore the
Redis RDB/queue archive; queued jobs are intentionally not replayed because
they may be stale or duplicate work. Verify workflows, service readiness, and
business data after restoration.

## After rollback

- Confirm API live/readiness endpoints and `/metrics`.
- Verify TLS ingress and n8n access.
- Confirm workflow queue operation and inspect failed executions.
- Check that scheduled backup and certificate-renewal timers remain enabled.
- Document the incident, selected image SHA, snapshot ID, data loss window, and
  follow-up actions.
