# Release v1.0.0

**Release date:** 2026-10-31  
**Version:** `1.0.0`  
**Status:** Release documentation and package metadata prepared. The Git tag
and production go-live are **not verified** in this workspace.

## Summary

v1.0.0 packages the currently implemented AI Agency platform baseline:

- NestJS API with liveness/readiness checks and Prometheus metrics.
- Authenticated internal Content Factory endpoints for structured OpenAI
  output, Notion project creation, and WhatsApp preview-only results.
- n8n content-factory workflow.
- Docker Compose development and single-host Ubuntu production templates.
- Nginx HTTPS ingress, file-mounted secrets, monitoring, CI deployment,
  encrypted-backup scripts, and operational runbooks.

See [CHANGELOG.md](./CHANGELOG.md) for the release summary.

## API compatibility and data

- No API contract changes are introduced by this documentation/version
  release.
- `GET /api/v1/health/live`, `GET /api/v1/health/ready`, and `GET /metrics`
  are the current health/metrics surfaces.
- The internal Content Factory routes are documented in
  [API-DESIGN.md](./API-DESIGN.md); they require the internal automation
  credential.
- No production database migration is included with this release.
- WhatsApp remains preview-only. Do not expect a message to be sent.

## Release artifact and tag

The root package and API workspace metadata are set to `1.0.0`. This workspace
does not contain a `.git` repository, so no commit or `v1.0.0` Git tag was
created. After committing the reviewed release contents in the authoritative
Git repository, create and publish the tag:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

Tag only the intended release commit. Record its full commit SHA in the release
record and use the matching immutable image tag for deployment.

## Verification record

Release validation is intentionally not represented as a live production
approval:

- Automated local checks must be run against the final release commit (see
  [PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md)).
- No live production Docker stack was available in this workspace at release
  documentation time.
- No production S3 credentials, restic repository, or staging restore target
  were available; backup integrity and restore were not verified.
- No production domain or deployed API was available for health verification.
- This release remains subject to operator go-live gates in the checklist.

## Deployment and recovery

Follow [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) and
[UPGRADE-GUIDE.md](./UPGRADE-GUIDE.md) for initial deployment and upgrades.
For recovery, use [ROLLBACK-GUIDE.md](./ROLLBACK-GUIDE.md). Do not treat image
rollback as a database restore.
