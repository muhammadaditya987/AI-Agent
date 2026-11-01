# AI Agency Web

Next.js App Router frontend for the AI Agency platform.

## Local development

1. Optionally copy `.env.example` to `.env.local`; the API URL defaults to `http://127.0.0.1:3001`.
2. Start the local backend and database services from the repository root.
3. From the repository root, run `npm install`, then `npm run dev:web`.

The frontend runs on port 3000 by default. The local API is available on port 3001.

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `API_INTERNAL_URL` | No | Local NestJS API URL; defaults to `http://127.0.0.1:3001`. |

The login form calls the NestJS API through the same-origin Next.js route handlers. Access and rotating refresh tokens are stored in `HttpOnly`, `SameSite=Lax` cookies; browser JavaScript never receives either token. Content Factory and workflow requests are proxied with the access token and authenticated by the backend.

## Current backend boundary

The API provides local JWT login, refresh, session, and logout endpoints. Content Factory and workflow requests are routed server-side with the HttpOnly access cookie; the NestJS guard verifies the JWT and scopes ownership to its subject. Neither an identity provider nor an automation secret is needed by the browser.

Content Factory generation creates a backend draft/history record. History search, generator/date/status/favorite filters, detail loading, pagination, favorites, draft updates, and deletion use the Content Factory API. Draft edits are auto-saved. JSON imports are validated and previewed before the backend import request; JSON, Markdown, and TXT exports are generated from a backend-loaded project.

The Workflow Builder loads its node catalog, node configuration fields, and saved graph definitions from `GET /api/v1/internal/workflows/node-catalog` and the authenticated workflow endpoints. Workflow metadata and graph changes are persisted with `POST`/`PUT`; graph validation is performed by the backend. The React Flow canvas state is held in Zustand and node/edge updates are auto-saved through TanStack Query.