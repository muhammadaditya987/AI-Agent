# API Design

## AI Agency Platform — REST API

| Atribut | Nilai |
|---|---|
| Versi | 1.1 |
| Status | Draft baseline, diselaraskan dengan n8n Sprint 2 |
| Tanggal | 31 Oktober 2026 |
| Referensi | [SRS.md](./SRS.md), [SDD.md](./SDD.md), [DATABASE-DESIGN.md](./DATABASE-DESIGN.md) |
| Gaya API | REST over HTTPS, JSON |

## 1. Tujuan dan Prinsip

Dokumen ini menetapkan kontrak REST untuk UI, API client organisasi, webhook, dan integrasi. API menerima serta mengembalikan JSON kecuali untuk endpoint ekspor file. Semua operasi harus tervalidasi, diotorisasi, dibatasi rate, dan dicatat sesuai kebijakan audit.

Prinsip utama:

- API versioning menggunakan prefix path `/api/v1`.
- Resource memakai nama plural dan identifier opaque UUID.
- Tenant menjadi bagian eksplisit URL `/tenants/{tenantId}`; tenant ID dari path tetap harus divalidasi terhadap identitas dan membership pemanggil.
- Operasi eksekusi workflow bersifat asynchronous: API mengembalikan `202 Accepted` dan `runId`, bukan menunggu model atau connector selesai.

Endpoint dalam dokumen ini adalah kontrak target platform dan belum seluruhnya diimplementasikan. Sprint 2 saat ini menyediakan endpoint internal khusus untuk dipanggil workflow n8n; endpoint tersebut bukan pengganti API publik multi-tenant yang dijelaskan di bawah.
- Operasi tulis sensitif mendukung `Idempotency-Key` atau optimistic concurrency sesuai jenis resource.
- API tidak mengembalikan secret, prompt tersembunyi, atau payload yang tidak berhak dilihat caller.
- Workflow published immutable; perubahan dilakukan pada draft atau versi baru.
- Semua waktu menggunakan ISO 8601 UTC, contohnya `2026-10-31T02:00:00Z`.

## 2. Base URL dan Konvensi HTTP

```text
Production: https://api.<domain-organisasi>/api/v1
Staging:    https://api-staging.<domain-organisasi>/api/v1
```

Contoh path:

```text
/tenants/{tenantId}/workspaces/{workspaceId}/workflows
```

Header umum:

| Header | Kegunaan |
|---|---|
| Authorization (Bearer) | Access token OIDC atau machine credential; jangan catat nilai header di log. |
| `Content-Type: application/json` | Request JSON. |
| `Accept: application/json` | Response JSON. |
| `X-Request-Id: <opaque-id>` | Opsional; correlation ID dari client, divalidasi dan dibatasi panjangnya. Server selalu menghasilkan request ID bila tidak ada. |
| `Idempotency-Key: <opaque-value>` | Wajib untuk operasi pemicu run; direkomendasikan pada operasi create lain yang rawan retry. |
| `If-Match: "<etag>"` | Optimistic concurrency pada update draft/resource yang mendukungnya. |
| `If-None-Match: "<etag>"` | Conditional GET untuk resource yang cacheable. |

`X-Tenant-Id` tidak digunakan sebagai sumber otorisasi. Tenant scope ditentukan oleh path dan membership/claim yang telah diverifikasi server.

## 3. Format Resource Bersama

### 3.1 Timestamp, identifier, dan status

- ID resource adalah string UUID.
- Timestamp berformat RFC 3339/ISO 8601 UTC.
- Status resource ditulis sebagai string stabil, misalnya `published`, `running`, atau `waiting_approval`.
- Field baru dapat ditambahkan tanpa menaikkan versi mayor; field yang sudah ada tidak diubah maknanya.

### 3.2 Pagination

Endpoint list menggunakan cursor pagination:

```text
?limit=50&cursor=<opaque-cursor>
```

- Default `limit=50`; maksimum `limit=100`.
- Urutan stabil berdasarkan `createdAt DESC` lalu `id DESC`, kecuali disebutkan berbeda.
- Cursor opaque dan terikat pada filter serta scope tenant.
- Response list:

```json
{
  "data": [],
  "page": {
    "limit": 50,
    "nextCursor": null,
    "hasMore": false
  }
}
```

Filter waktu menggunakan `createdAfter` dan `createdBefore` dalam ISO 8601. Filter status menerima nilai yang didokumentasikan untuk resource terkait.

### 3.3 Envelope error

Semua error menggunakan `application/problem+json` dengan format:

```json
{
  "type": "https://api.example.com/problems/validation-error",
  "title": "Request validation failed",
  "status": 422,
  "code": "VALIDATION_ERROR",
  "detail": "One or more fields are invalid.",
  "instance": "/api/v1/tenants/...",
  "requestId": "req_01J...",
  "errors": [
    {
      "field": "inputSchema",
      "code": "INVALID_SCHEMA",
      "message": "Schema must be a valid JSON Schema object."
    }
  ]
}
```

`detail`, `message`, dan error eksternal harus disanitasi. Jangan mengirim stack trace, SQL, token, credential reference rahasia, prompt internal, atau payload sensitif dalam response error.

## 4. Authentication dan Authorization

### 4.1 User authentication

- User login melalui OIDC Authorization Code flow dengan PKCE menggunakan identity provider organisasi/platform.
- Client memperoleh access token bertanda tangan dan mengirimkannya melalui `Authorization: Bearer`.
- API memvalidasi signature, issuer, audience, expiry, dan claims sebelum mengidentifikasi subject.
- Server memetakan pasangan `(issuer, subject)` ke user aplikasi, lalu memeriksa membership tenant dan permission untuk setiap resource.
- Refresh token ditangani oleh identity provider/client yang sesuai; API tidak menerima password user.
- Untuk UI berbasis browser, token disimpan sesuai standar keamanan aplikasi; cookie session harus `Secure`, `HttpOnly`, dan `SameSite` yang sesuai bila pola BFF digunakan.

### 4.2 Machine-to-machine authentication

Pilihan utama enterprise adalah OAuth 2.0 Client Credentials melalui identity provider. Bila API client key digunakan sesuai skema Database Design:

- Key memiliki entropy tinggi, ditampilkan hanya sekali, dan dikirim melalui header Bearer.
- Server menyimpan hash key, prefix untuk identifikasi operasional, scopes, status, dan expiry.
- Key dapat dirotasi/dicabut; setiap key terikat ke satu API client dan tenant.
- Key tidak dapat mengakses operasi admin atau tenant lain di luar scopes yang diberikan.
- Untuk koneksi berisiko tinggi, gunakan OAuth client credentials/mTLS sebagai pengganti API key statis.

### 4.3 Scope dan permission

Scope OAuth membatasi kelas API, contohnya:

```text
workflows:read
workflows:write
workflows:publish
runs:trigger
runs:read
runs:cancel
approvals:decide
connectors:manage
audit:read
usage:read
```

Scope token bukan pengganti RBAC. Server memeriksa keduanya: scope machine client dan permission actor terhadap tenant/workspace/resource. Contoh permission domain antara lain `workflow.read`, `workflow.edit`, `workflow.publish`, `run.trigger`, `run.cancel`, `approval.decide`, `connector.manage`, `audit.read`.

### 4.4 Webhook inbound

Webhook provider memakai endpoint khusus per sumber dan autentikasi signature provider, bukan bearer token user. Validasi signature atas raw request body, timestamp/replay window, ukuran payload, dan rate limit harus dilakukan sebelum event diterima. Event harus disimpan durable sebelum API mengirim acknowledgement. Detail provider-specific path ditetapkan saat connector dirancang.

## 5. Ringkasan Endpoint

Semua endpoint di bawah memakai prefix `/api/v1`. `{tenantId}`, `{workspaceId}`, dan resource ID adalah UUID.

### 5.1 Identity dan organisasi

| Method | Path | Fungsi | Permission |
|---|---|---|---|
| `GET` | `/me` | Profil actor dan tenant/workspace yang dapat diakses | Authenticated |
| `GET` | `/tenants` | Daftar tenant tempat user menjadi anggota | Authenticated |
| `GET` | `/tenants/{tenantId}` | Detail tenant | `tenant.read` |
| `GET` | `/tenants/{tenantId}/members` | List membership | `member.read` |
| `POST` | `/tenants/{tenantId}/members/invitations` | Undang user ke tenant | `member.invite` |
| `PATCH` | `/tenants/{tenantId}/members/{userId}` | Ubah status/akses membership | `member.manage` |
| `GET` | `/tenants/{tenantId}/workspaces` | List workspace | `workspace.read` |
| `POST` | `/tenants/{tenantId}/workspaces` | Buat workspace | `workspace.create` |
| `GET` | `/tenants/{tenantId}/workspaces/{workspaceId}` | Detail workspace | `workspace.read` |
| `PATCH` | `/tenants/{tenantId}/workspaces/{workspaceId}` | Ubah metadata/status workspace | `workspace.manage` |

### 5.2 Workflow dan versi

| Method | Path | Fungsi | Permission |
|---|---|---|---|
| `GET` | `/tenants/{tenantId}/workspaces/{workspaceId}/workflows` | List/search workflow | `workflow.read` |
| `POST` | `/tenants/{tenantId}/workspaces/{workspaceId}/workflows` | Buat workflow dan draft awal | `workflow.create` |
| `GET` | `/tenants/{tenantId}/workflows/{workflowId}` | Detail workflow | `workflow.read` |
| `PATCH` | `/tenants/{tenantId}/workflows/{workflowId}` | Ubah metadata workflow | `workflow.edit` |
| `DELETE` | `/tenants/{tenantId}/workflows/{workflowId}` | Arsipkan workflow, bukan hard delete | `workflow.archive` |
| `GET` | `/tenants/{tenantId}/workflows/{workflowId}/versions` | List versi | `workflow.read` |
| `POST` | `/tenants/{tenantId}/workflows/{workflowId}/versions` | Buat draft versi berikutnya | `workflow.edit` |
| `GET` | `/tenants/{tenantId}/workflows/{workflowId}/versions/{versionId}` | Detail definisi versi | `workflow.read` |
| `PUT` | `/tenants/{tenantId}/workflows/{workflowId}/versions/{versionId}` | Ganti definisi draft | `workflow.edit` |
| `POST` | `/tenants/{tenantId}/workflows/{workflowId}/versions/{versionId}/validate` | Validasi graph/schema/policy | `workflow.edit` |
| `POST` | `/tenants/{tenantId}/workflows/{workflowId}/versions/{versionId}/test-runs` | Jalankan uji coba non-produksi | `workflow.test` |
| `POST` | `/tenants/{tenantId}/workflows/{workflowId}/versions/{versionId}/publish` | Terbitkan versi immutable | `workflow.publish` |
| `POST` | `/tenants/{tenantId}/workflows/{workflowId}/activate-version` | Pilih versi published yang aktif | `workflow.publish` |

### 5.3 Runs dan approval

| Method | Path | Fungsi | Permission |
|---|---|---|---|
| `POST` | `/tenants/{tenantId}/workflows/{workflowId}/runs` | Trigger workflow asinkron | `run.trigger` |
| `GET` | `/tenants/{tenantId}/runs` | List/filter run | `run.read` |
| `GET` | `/tenants/{tenantId}/runs/{runId}` | Detail run | `run.read` |
| `GET` | `/tenants/{tenantId}/runs/{runId}/steps` | Timeline langkah | `run.read` |
| `POST` | `/tenants/{tenantId}/runs/{runId}/cancel` | Minta pembatalan run | `run.cancel` |
| `POST` | `/tenants/{tenantId}/runs/{runId}/reruns` | Re-run sesuai policy | `run.trigger` |
| `GET` | `/tenants/{tenantId}/approvals` | Inbox approval | `approval.read` |
| `GET` | `/tenants/{tenantId}/approvals/{approvalId}` | Detail approval | `approval.read` |
| `POST` | `/tenants/{tenantId}/approvals/{approvalId}/decision` | Approve/reject | `approval.decide` |

### 5.4 Connector, AI policy, dan schedule

| Method | Path | Fungsi | Permission |
|---|---|---|---|
| `GET` | `/tenants/{tenantId}/connector-types` | Katalog tipe connector yang tersedia | `connector.read` |
| `GET` | `/tenants/{tenantId}/connectors` | List connector instance | `connector.read` |
| `POST` | `/tenants/{tenantId}/connectors` | Buat connector instance | `connector.manage` |
| `GET` | `/tenants/{tenantId}/connectors/{connectorId}` | Detail non-secret connector | `connector.read` |
| `PATCH` | `/tenants/{tenantId}/connectors/{connectorId}` | Ubah config/status | `connector.manage` |
| `POST` | `/tenants/{tenantId}/connectors/{connectorId}/test` | Uji koneksi | `connector.manage` |
| `POST` | `/tenants/{tenantId}/connectors/{connectorId}/rotate-credential` | Ganti credential reference | `connector.manage` |
| `DELETE` | `/tenants/{tenantId}/connectors/{connectorId}` | Cabut/nonaktifkan connector | `connector.manage` |
| `GET` | `/tenants/{tenantId}/ai-policies` | List policy AI | `ai-policy.read` |
| `POST` | `/tenants/{tenantId}/ai-policies` | Buat policy AI | `ai-policy.manage` |
| `PATCH` | `/tenants/{tenantId}/ai-policies/{policyId}` | Ubah/nonaktifkan policy | `ai-policy.manage` |
| `GET` | `/tenants/{tenantId}/workflows/{workflowId}/schedules` | List jadwal workflow | `schedule.read` |
| `POST` | `/tenants/{tenantId}/workflows/{workflowId}/schedules` | Buat jadwal | `schedule.manage` |
| `GET` | `/tenants/{tenantId}/schedules/{scheduleId}` | Detail jadwal | `schedule.read` |
| `PATCH` | `/tenants/{tenantId}/schedules/{scheduleId}` | Ubah jadwal/aktifkan/nonaktifkan | `schedule.manage` |
| `DELETE` | `/tenants/{tenantId}/schedules/{scheduleId}` | Hapus jadwal | `schedule.manage` |

### 5.5 Audit, usage, API clients, templates

| Method | Path | Fungsi | Permission |
|---|---|---|---|
| `GET` | `/tenants/{tenantId}/audit-events` | Query audit tenant | `audit.read` |
| `GET` | `/tenants/{tenantId}/usage` | Agregat usage/biaya | `usage.read` |
| `GET` | `/tenants/{tenantId}/runs/{runId}/usage` | Usage detail per run | `usage.read` |
| `GET` | `/tenants/{tenantId}/api-clients` | List API client | `api-client.manage` |
| `POST` | `/tenants/{tenantId}/api-clients` | Buat API client | `api-client.manage` |
| `POST` | `/tenants/{tenantId}/api-clients/{clientId}/keys` | Terbitkan key; secret hanya dikembalikan sekali | `api-client.manage` |
| `DELETE` | `/tenants/{tenantId}/api-clients/{clientId}/keys/{keyId}` | Cabut key | `api-client.manage` |
| `GET` | `/tenants/{tenantId}/workflow-templates` | List template platform/tenant | `workflow.read` |
| `POST` | `/tenants/{tenantId}/workspaces/{workspaceId}/workflows/from-template` | Buat workflow dari template | `workflow.create` |

Endpoint evaluasi AI, knowledge source/RAG, ekspor audit, dan admin platform termasuk fase lanjutan. Endpoint tersebut memerlukan kontrak tersendiri sebelum diaktifkan.

## 6. Request dan Response Endpoint Utama

Contoh berikut normatif untuk shape dan perilaku. Field opsional dapat bergantung pada konfigurasi tenant; field rahasia tidak pernah menjadi response.

### 6.1 Membuat workflow

`POST /api/v1/tenants/{tenantId}/workspaces/{workspaceId}/workflows`

Request:

```json
{
  "name": "Triage tiket masuk",
  "slug": "triage-tiket-masuk",
  "description": "Klasifikasi dan arahkan tiket berdasarkan aturan tim.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "ticketId": { "type": "string" },
      "body": { "type": "string" }
    },
    "required": ["ticketId", "body"]
  },
  "definition": {
    "nodes": [],
    "edges": []
  }
}
```

Response `201 Created`:

```json
{
  "data": {
    "id": "8de34580-55de-4e31-b221-718e16b810c9",
    "tenantId": "0a9e50dc-0238-4ed0-9c33-616bdc3a04b4",
    "workspaceId": "e807e230-85e6-4402-8724-5c0ca973ce3a",
    "name": "Triage tiket masuk",
    "slug": "triage-tiket-masuk",
    "status": "draft",
    "activeVersionId": null,
    "createdAt": "2026-10-31T02:00:00Z",
    "updatedAt": "2026-10-31T02:00:00Z"
  },
  "meta": {
    "initialDraftVersionId": "a61db0bb-92a5-44fd-8800-735e3b6fb3b0"
  }
}
```

### 6.2 Membuat dan memperbarui draft versi

`POST /api/v1/tenants/{tenantId}/workflows/{workflowId}/versions`

Request:

```json
{
  "sourceVersionId": "a61db0bb-92a5-44fd-8800-735e3b6fb3b0",
  "changeSummary": "Menambahkan pemeriksaan kategori"
}
```

Response `201 Created`:

```json
{
  "data": {
    "id": "2e9ba8a3-4ee9-4562-8580-c387ddc5f241",
    "workflowId": "8de34580-55de-4e31-b221-718e16b810c9",
    "versionNumber": 2,
    "lifecycleStatus": "draft",
    "createdAt": "2026-10-31T02:05:00Z"
  }
}
```

`PUT /api/v1/tenants/{tenantId}/workflows/{workflowId}/versions/{versionId}` menerima keseluruhan definisi draft. Response `200 OK` memberikan versi terbaru dan header `ETag`. Request berikutnya wajib membawa `If-Match`; mismatch menghasilkan `412 Precondition Failed`. Versi published/retired tidak dapat diubah.

Request ringkas:

```json
{
  "definition": {
    "nodes": [],
    "edges": []
  },
  "inputSchema": { "type": "object" },
  "outputSchema": { "type": "object" },
  "changeSummary": "Memperbarui jalur approval"
}
```

### 6.3 Validasi dan publish

`POST /api/v1/tenants/{tenantId}/workflows/{workflowId}/versions/{versionId}/validate`

Request:

```json
{
  "includePolicyChecks": true
}
```

Response `200 OK`:

```json
{
  "data": {
    "valid": false,
    "errors": [
      {
        "code": "CONNECTOR_BINDING_MISSING",
        "nodeKey": "send_reply",
        "field": "connectorInstanceId",
        "message": "Node ini membutuhkan connector yang diizinkan."
      }
    ],
    "warnings": []
  }
}
```

Validasi workflow yang berhasil menggunakan status `200` dengan `valid: true`; validasi bukan operasi yang membuat versi published.

`POST /api/v1/tenants/{tenantId}/workflows/{workflowId}/versions/{versionId}/publish`

Request:

```json
{
  "changeSummary": "Publish hasil review",
  "activate": true
}
```

Response `200 OK`:

```json
{
  "data": {
    "workflowId": "8de34580-55de-4e31-b221-718e16b810c9",
    "versionId": "2e9ba8a3-4ee9-4562-8580-c387ddc5f241",
    "versionNumber": 2,
    "lifecycleStatus": "published",
    "active": true,
    "publishedAt": "2026-10-31T02:10:00Z"
  }
}
```

Jika definisi gagal validasi atau permission tidak memadai, tidak ada perubahan publikasi.

### 6.4 Trigger workflow

`POST /api/v1/tenants/{tenantId}/workflows/{workflowId}/runs`

Header wajib:

```text
Idempotency-Key: client-operation-unique-value
```

Request:

```json
{
  "versionId": "2e9ba8a3-4ee9-4562-8580-c387ddc5f241",
  "input": {
    "ticketId": "TCK-1042",
    "body": "Saya belum menerima konfirmasi pesanan."
  },
  "callbackUrl": "https://client.example.com/hooks/workflow-result",
  "metadata": {
    "source": "support-portal"
  }
}
```

`callbackUrl` opsional dan hanya diterima jika destination cocok dengan kebijakan allowlist/SSRF platform; callback tidak menjadikan API synchronous.

Response `202 Accepted`:

```json
{
  "data": {
    "runId": "f6d7434b-6e8d-4c72-8760-d628bc478a04",
    "workflowId": "8de34580-55de-4e31-b221-718e16b810c9",
    "workflowVersionId": "2e9ba8a3-4ee9-4562-8580-c387ddc5f241",
    "status": "queued",
    "createdAt": "2026-10-31T02:12:00Z"
  },
  "links": {
    "self": "/api/v1/tenants/0a9e50dc-0238-4ed0-9c33-616bdc3a04b4/runs/f6d7434b-6e8d-4c72-8760-d628bc478a04"
  }
}
```

Jika idempotency key dan request hash sama dipakai kembali selama retensi, server mengembalikan run/response awal. Jika key sama digunakan dengan request berbeda, server merespons `409 Conflict` dengan `IDEMPOTENCY_KEY_REUSED`.

### 6.5 List run dan detail run

`GET /api/v1/tenants/{tenantId}/runs?status=failed&workflowId={id}&createdAfter=...&limit=50&cursor=...`

Response `200 OK`:

```json
{
  "data": [
    {
      "runId": "f6d7434b-6e8d-4c72-8760-d628bc478a04",
      "workflowId": "8de34580-55de-4e31-b221-718e16b810c9",
      "workflowVersionId": "2e9ba8a3-4ee9-4562-8580-c387ddc5f241",
      "triggerType": "api",
      "status": "running",
      "createdAt": "2026-10-31T02:12:00Z",
      "startedAt": "2026-10-31T02:12:01Z",
      "completedAt": null
    }
  ],
  "page": {
    "limit": 50,
    "nextCursor": null,
    "hasMore": false
  }
}
```

`GET /api/v1/tenants/{tenantId}/runs/{runId}` response:

```json
{
  "data": {
    "runId": "f6d7434b-6e8d-4c72-8760-d628bc478a04",
    "workflowId": "8de34580-55de-4e31-b221-718e16b810c9",
    "workflowVersionId": "2e9ba8a3-4ee9-4562-8580-c387ddc5f241",
    "status": "succeeded",
    "trigger": {
      "type": "api",
      "actorId": "b62f142d-e042-4a56-8bae-b96ef3703893"
    },
    "startedAt": "2026-10-31T02:12:01Z",
    "completedAt": "2026-10-31T02:12:08Z",
    "result": {
      "classification": "order_status",
      "confidence": 0.94
    },
    "error": null,
    "correlationId": "corr_01J..."
  }
}
```

Hasil sensitif dapat diganti dengan `resultRef` atau disamarkan sesuai role dan retensi tenant.

### 6.6 Timeline steps

`GET /api/v1/tenants/{tenantId}/runs/{runId}/steps`

Response `200 OK`:

```json
{
  "data": [
    {
      "stepKey": "classify_request",
      "attempt": 1,
      "type": "ai",
      "status": "succeeded",
      "startedAt": "2026-10-31T02:12:02Z",
      "completedAt": "2026-10-31T02:12:04Z",
      "durationMs": 1800,
      "error": null,
      "resultPreview": {
        "classification": "order_status"
      }
    }
  ]
}
```

`resultPreview` dapat dihilangkan atau dimasking berdasarkan policy dan permission.

### 6.7 Cancel dan rerun

`POST /api/v1/tenants/{tenantId}/runs/{runId}/cancel`

Request:

```json
{
  "reason": "Dibatalkan oleh operator"
}
```

Response `202 Accepted`:

```json
{
  "data": {
    "runId": "f6d7434b-6e8d-4c72-8760-d628bc478a04",
    "status": "cancelling",
    "requestedAt": "2026-10-31T02:13:00Z"
  }
}
```

`cancelling` adalah status transisi API; status terminal akhirnya menjadi `cancelled` atau status aktual jika operasi eksternal yang sedang berlangsung tidak dapat dibatalkan.

`POST /api/v1/tenants/{tenantId}/runs/{runId}/reruns`

Request:

```json
{
  "mode": "from_safe_checkpoint",
  "reason": "Memulihkan langkah setelah connector kembali tersedia"
}
```

Mode yang didukung harus eksplisit, misalnya `full` atau `from_safe_checkpoint`. Server menolak rerun yang dapat mengulang side effect berbahaya tanpa idempotency atau approval. Response `202 Accepted` mengembalikan `newRunId` dan `sourceRunId`.

### 6.8 Approval

`GET /api/v1/tenants/{tenantId}/approvals?status=pending&limit=50`

Response `200 OK`:

```json
{
  "data": [
    {
      "approvalId": "53a2a3c4-e746-44a4-9bb7-0c1a8e7ae573",
      "runId": "f6d7434b-6e8d-4c72-8760-d628bc478a04",
      "stepKey": "send_reply",
      "status": "pending",
      "summary": "Workflow akan mengirim balasan ke pelanggan.",
      "requestedAt": "2026-10-31T02:14:00Z",
      "expiresAt": "2026-10-31T03:14:00Z"
    }
  ],
  "page": {
    "limit": 50,
    "nextCursor": null,
    "hasMore": false
  }
}
```

`POST /api/v1/tenants/{tenantId}/approvals/{approvalId}/decision`

Request:

```json
{
  "decision": "approved",
  "reason": "Konten telah ditinjau."
}
```

`decision` hanya `approved` atau `rejected`. Response `200 OK` berisi approval, status run terbaru yang diketahui, actor dan waktu keputusan. Request keputusan kedua terhadap approval final menghasilkan `409 Conflict`; keputusan oleh actor tanpa hak menghasilkan `403 Forbidden`.

### 6.9 Connector

`POST /api/v1/tenants/{tenantId}/connectors`

Request:

```json
{
  "workspaceId": "e807e230-85e6-4402-8724-5c0ca973ce3a",
  "connectorType": {
    "code": "http",
    "version": "1"
  },
  "name": "CRM Support",
  "config": {
    "baseUrl": "https://crm.example.com/api",
    "allowedOperations": ["tickets.read", "tickets.update"]
  },
  "credentialInput": {
    "secretManagerKey": "tenant/connector/crm-support"
  }
}
```

`credentialInput` menerima hanya alur secret manager yang disetujui; jangan mengirim/menyimpan token plaintext pada resource API.

Response `201 Created`:

```json
{
  "data": {
    "id": "f2ee21c0-cf93-48a5-b44f-1cc920c470ec",
    "name": "CRM Support",
    "connectorType": {
      "code": "http",
      "version": "1"
    },
    "status": "active",
    "credentialConfigured": true,
    "lastHealthCheckAt": null,
    "createdAt": "2026-10-31T02:15:00Z"
  }
}
```

`POST .../connectors/{connectorId}/test` response `200 OK` berisi `status: "healthy" | "unhealthy"`, `checkedAt`, `latencyMs`, dan error code tersanitasi bila gagal. Tidak mengembalikan response body eksternal secara mentah.

### 6.10 AI policy

`POST /api/v1/tenants/{tenantId}/ai-policies`

Request:

```json
{
  "name": "Default tenant policy",
  "allowedProviders": ["approved-provider"],
  "allowedModels": ["approved-model-alias"],
  "maxTokensPerRun": 12000,
  "maxEstimatedCostPerRun": {
    "amount": "0.50",
    "currency": "USD"
  },
  "redactionMode": "before_external_call",
  "requireApprovalRiskLevel": "high"
}
```

Response `201 Created` mengembalikan policy ID dan nilai konfigurasi non-secret. Provider/model divalidasi terhadap katalog server-side; endpoint bebas atau model arbitrer tidak diterima.

### 6.11 Schedule

`POST /api/v1/tenants/{tenantId}/workflows/{workflowId}/schedules`

Request:

```json
{
  "workflowVersionId": "2e9ba8a3-4ee9-4562-8580-c387ddc5f241",
  "cron": "0 9 * * 1-5",
  "timezone": "Asia/Jakarta",
  "overlapPolicy": "skip",
  "missedRunPolicy": "catch_up_once",
  "enabled": true,
  "input": {
    "source": "scheduled"
  }
}
```

Response `201 Created` mengembalikan `scheduleId`, workflow/version, kebijakan, `enabled`, `nextRunAt`, dan timestamp. Identifier n8n internal tidak diekspos ke client. Schedule hanya dapat menggunakan workflow version published.

### 6.12 Audit dan usage

`GET /api/v1/tenants/{tenantId}/audit-events?targetType=workflow&targetId={id}&createdAfter=...`

Response `200 OK` berisi actor, action, target, waktu, correlation ID, dan metadata tersanitasi; tidak menampilkan rahasia atau payload sensitif.

`GET /api/v1/tenants/{tenantId}/usage?groupBy=workflow&from=...&to=...`

Response `200 OK`:

```json
{
  "data": {
    "period": {
      "from": "2026-10-01T00:00:00Z",
      "to": "2026-11-01T00:00:00Z"
    },
    "totals": {
      "runs": 420,
      "inputTokens": 120000,
      "outputTokens": 34000,
      "estimatedCost": {
        "amount": "18.42",
        "currency": "USD"
      }
    },
    "groups": []
  }
}
```

Nilai biaya adalah estimasi berdasarkan data provider dan dapat dikoreksi melalui rekonsiliasi billing.

### 6.13 API client

`POST /api/v1/tenants/{tenantId}/api-clients` menerima `name` dan `scopes`; response `201 Created` menampilkan metadata client.

`POST /api/v1/tenants/{tenantId}/api-clients/{clientId}/keys` menerima `expiresAt` opsional dan scopes yang merupakan subset scopes client. Response `201 Created` mengembalikan `key` mentah satu kali bersama `keyId`, `keyPrefix`, dan `expiresAt`. Server menyimpan hash saja. Key tidak muncul lagi pada GET/list.

## 7. Endpoint Detail dan Query

### 7.1 List workflow

`GET /api/v1/tenants/{tenantId}/workspaces/{workspaceId}/workflows?status=published&search=triage&limit=50&cursor=...`

Response list memakai envelope pagination umum. `search` dibatasi panjangnya dan hanya mencari metadata yang boleh diakses.

### 7.2 Get versi workflow

`GET /api/v1/tenants/{tenantId}/workflows/{workflowId}/versions/{versionId}` response berisi:

- metadata versi dan lifecycle;
- definisi graph JSON;
- input/output schema;
- workflow ID, nomor versi, creator, waktu pembuatan/publikasi;
- ringkasan konfigurasi AI dan connector tanpa secret.

Published version dapat diakses read-only; endpoint tidak mengembalikan credential reference internal yang tidak diperlukan client.

### 7.3 Nonaktifkan/arsipkan

`DELETE` pada workflow, connector, schedule, atau key bermakna lifecycle action/revocation sesuai resource; bukan hard-delete umum. Response `204 No Content` jika operasi selesai sinkron, atau `202 Accepted` jika perubahan eksternal/asinkron masih diproses.

### 7.4 Webhook callback

Callback hasil run dikirim oleh platform ke URL yang telah dikonfigurasi dan diizinkan. Payload callback minimal:

```json
{
  "eventId": "evt_01J...",
  "eventType": "workflow.run.completed",
  "occurredAt": "2026-10-31T02:20:00Z",
  "tenantId": "0a9e50dc-0238-4ed0-9c33-616bdc3a04b4",
  "runId": "f6d7434b-6e8d-4c72-8760-d628bc478a04",
  "status": "succeeded",
  "resourceUrl": "/api/v1/tenants/.../runs/..."
}
```

Callback harus ditandatangani dengan secret yang dapat dirotasi; consumer wajib dedup berdasarkan `eventId`. Retry callback tidak mengubah status workflow run.

## 8. Error dan Status Code

### 8.1 Status code

| HTTP | Penggunaan |
|---:|---|
| `200 OK` | GET berhasil; update/decision/validasi berhasil dengan response body. |
| `201 Created` | Resource dibuat; response menyertakan resource dan header `Location` bila relevan. |
| `202 Accepted` | Trigger, cancel, rerun, atau operasi asinkron diterima tetapi belum selesai. |
| `204 No Content` | Operasi selesai tanpa body, misalnya pencabutan resource sinkron. |
| `400 Bad Request` | Sintaks JSON/query/header tidak valid atau parameter wajib hilang. |
| `401 Unauthorized` | Token/key tidak ada, tidak valid, expired, atau issuer/audience tidak sesuai. |
| `403 Forbidden` | Identitas valid tetapi tidak punya scope/permission untuk aksi. |
| `404 Not Found` | Resource tidak ada atau tidak dapat diakses pada scope tersebut; gunakan perilaku seragam untuk mencegah enumerasi tenant/resource. |
| `409 Conflict` | Konflik state, duplicate yang tidak konsisten, key idempotency dipakai dengan payload lain, atau approval sudah final. |
| `412 Precondition Failed` | `If-Match` tidak cocok dengan ETag versi resource. |
| `413 Content Too Large` | Request/payload melebihi batas ukuran yang didokumentasikan. |
| `415 Unsupported Media Type` | Content-Type tidak didukung. |
| `422 Unprocessable Content` | JSON valid tetapi gagal validasi skema, workflow, policy, atau business rule. |
| `429 Too Many Requests` | Rate limit/kuota permintaan tercapai; sertakan `Retry-After` bila diketahui. |
| `500 Internal Server Error` | Kegagalan tak terduga; response hanya error generik dan request ID. |
| `502 Bad Gateway` | Respons upstream tidak valid atau kegagalan gateway ke provider, bila operasi API bersifat sinkron. |
| `503 Service Unavailable` | API sementara tidak dapat menerima request; sertakan `Retry-After` bila memungkinkan. |
| `504 Gateway Timeout` | Timeout upstream pada operasi sinkron. Trigger run tidak menunggu provider AI sehingga timeout aktivitas biasanya dilaporkan pada status run, bukan response trigger. |

### 8.2 Kode error domain

| Kode | Status lazim | Keterangan |
|---|---:|---|
| `VALIDATION_ERROR` | 422 | Field/schema request tidak valid; rincian tersedia di `errors`. |
| `AUTHENTICATION_REQUIRED` | 401 | Kredensial autentikasi tidak ada. |
| `TOKEN_INVALID` | 401 | Token invalid, expired, issuer/audience salah, atau tidak dapat diverifikasi. |
| `PERMISSION_DENIED` | 403 | Permission atau scope tidak memadai. |
| `RESOURCE_NOT_FOUND` | 404 | Resource tidak ditemukan/terlihat pada scope caller. |
| `TENANT_ACCESS_DENIED` | 404 atau 403 | Pilih perilaku konsisten; rekomendasi 404 untuk mengurangi enumerasi tenant. |
| `RESOURCE_CONFLICT` | 409 | Operasi bertentangan dengan status resource. |
| `IDEMPOTENCY_KEY_REUSED` | 409 | Key sama dipakai untuk request dengan hash berbeda. |
| `APPROVAL_ALREADY_DECIDED` | 409 | Approval tidak lagi pending. |
| `VERSION_IMMUTABLE` | 409 | Perubahan diminta pada published/retired workflow version. |
| `ETAG_MISMATCH` | 412 | Resource diubah oleh request lain sejak dibaca. |
| `QUOTA_EXCEEDED` | 429 | Kuota tenant/workflow tercapai. |
| `RATE_LIMITED` | 429 | Batas request atau connector dicapai. |
| `WORKFLOW_INVALID` | 422 | Definisi workflow tidak valid untuk test/publish. |
| `POLICY_BLOCKED` | 422 atau 403 | Operasi/model/tool ditolak oleh policy; status ditetapkan konsisten menurut apakah penolakan terkait request atau otorisasi. |
| `CONNECTOR_UNAVAILABLE` | 503 | Connector/provider sementara tidak tersedia; jika terjadi dalam run, dicatat pada step/run. |
| `PAYLOAD_TOO_LARGE` | 413 | Ukuran request melebihi batas. |
| `INTERNAL_ERROR` | 500 | Error tidak terduga dengan `requestId` untuk investigasi. |

Error request harus stabil dan machine-readable melalui `code`; client tidak boleh bergantung pada parsing `detail` atau pesan bebas.

## 9. Validasi dan Batas Request

- JSON body wajib untuk operasi create/update yang memiliki payload; `GET` tidak menerima body.
- Unknown field: ditolak untuk kontrak yang sensitif atau diabaikan hanya jika kebijakan kompatibilitas endpoint secara eksplisit mengizinkan. Perilaku harus konsisten dan tercatat pada OpenAPI.
- UUID, URL, enum, waktu, ukuran string, nesting JSON, jumlah node workflow, jumlah edge, dan ukuran body dibatasi.
- API memvalidasi input/output schema workflow dan memeriksa referensi tenant/resource sebelum menyimpan.
- URL callback dan HTTP connector tunduk pada allowlist serta perlindungan SSRF; jangan menerima URL arbitrer hanya karena bertipe URL.
- Batas body awal ditetapkan oleh konfigurasi gateway/API setelah uji beban; payload besar harus menggunakan upload flow terkontrol ke object storage.
- Request ID, idempotency key, cursor, dan correlation ID memiliki batas panjang dan karakter yang diizinkan.

## 10. Versioning dan Kompatibilitas

- Versi mayor berada pada path, misalnya `/api/v1`.
- Perubahan aditif (field optional baru, endpoint baru, enum baru yang tidak mematahkan client) dapat dilakukan dalam versi mayor yang sama dengan dokumentasi.
- Menghapus/rename field, mengubah makna, mengubah status transition, atau memperketat kontrak dengan cara yang merusak client memerlukan versi mayor baru atau periode deprecation.
- Field enum harus diperlakukan client sebagai nilai yang mungkin bertambah; client tidak boleh crash pada nilai yang belum dikenal.
- Deprecation diumumkan melalui dokumentasi dan header `Deprecation`/`Sunset` bila relevan.
- Kontrak OpenAPI harus menjadi artefak release dan diverifikasi dengan contract test.

## 11. Rate Limit, Retry, dan Observability

- Rate limit diterapkan per IP untuk ingress publik, per user/client, per tenant, dan per endpoint sensitif.
- Respons `429` menyertakan `Retry-After` bila tersedia dan informasi rate limit non-sensitif.
- Client hanya melakukan retry otomatis untuk operasi idempoten atau operasi dengan `Idempotency-Key`, dengan exponential backoff dan jitter.
- `POST` trigger harus menggunakan idempotency key; API tidak menjanjikan exactly-once execution. Jaminan praktis adalah penerimaan durable dan dedup dalam masa retensi.
- Setiap response membawa `X-Request-Id`; run mengembalikan `runId` dan `correlationId` bila tersedia.
- Log API merekam route template, status, durasi, actor/client reference, tenant reference terkontrol, dan request ID; jangan merekam Authorization header atau payload rahasia.
- API menampilkan usage AI/connector melalui endpoint usage, bukan mengekspos execution ID, credential, atau endpoint internal n8n.

## 12. Keamanan API

1. HTTPS wajib; HTTP diarahkan atau ditolak di edge.
2. Otorisasi diterapkan pada setiap request, termasuk tenant dan resource-level checks; UUID yang sulit ditebak bukan kontrol akses.
3. API tidak mengembalikan secret sesudah create/rotate. Secret/API key mentah hanya dapat dikembalikan satu kali pada operasi penerbitan yang berwenang.
4. Error, audit API, dan log tidak menampilkan bearer token, API key, credential, prompt sensitif, atau payload lengkap secara default.
5. CORS dibatasi pada origin UI yang disetujui. Cookie/session browser dilindungi CSRF sesuai pola autentikasi.
6. Webhook memverifikasi signature atas raw body, timestamp/replay window, dan deduplikasi event sebelum enqueue.
7. Connector generik dan callback menerapkan egress allowlist, validasi DNS/IP, pembatasan redirect dan protokol untuk mencegah SSRF.
8. Endpoint publish, approval, key rotation, connector management, dan cancel memerlukan permission khusus serta audit event.

## 13. Endpoint yang Tidak Dibuka ke Client

API publik tidak mengekspos:

- n8n editor/API, credential store, execution data mentah, Redis queue, atau worker control.
- Endpoint SQL/database, cache, atau object storage internal.
- Secret Manager/KMS secara langsung.
- Stack trace dan internal provider error mentah.
- Endpoint generik yang memungkinkan eksekusi kode, akses jaringan arbitrer, atau model URL arbitrer.

Operasi health internal (misalnya readiness/liveness) berada pada endpoint internal platform dan tidak mengungkap detail tenant atau dependency sensitif.

## 14. Kriteria Penerimaan API

1. Semua endpoint tenant-scoped menerapkan autentikasi, membership, permission, dan isolasi tenant.
2. Trigger mengembalikan `202` hanya setelah run dan outbox tersimpan durable.
3. Request trigger berulang dengan idempotency key yang sama tidak membuat run ganda; key yang sama dengan body berbeda menghasilkan `409`.
4. Published workflow version tidak dapat diubah melalui API.
5. Run list/detail tidak mengembalikan payload yang tidak boleh dilihat atau melintasi tenant.
6. Approval hanya dapat diputuskan oleh approver berwenang dan hanya sekali.
7. API tidak mengembalikan credential/API key lagi setelah penerbitan pertama.
8. Error menggunakan envelope stabil, tidak membocorkan internal detail, dan menyertakan request ID.
9. Rate limit, pagination, sorting/filter, ETag, dan retry semantics terdokumentasi serta diuji dengan contract test.
10. Kontrak API final dipublikasikan sebagai OpenAPI sebelum implementasi client/integrasi dikunci.

## 15. Keputusan Terbuka Sebelum API Dibekukan

1. Domain/API hostname dan apakah UI menggunakan pola Backend-for-Frontend.
2. Provider OIDC dan mekanisme machine-to-machine: OAuth client credentials, API key, atau keduanya.
3. Maksimum ukuran body, pagination limit, rate limit, dan masa retensi idempotency key.
4. Apakah `callbackUrl` bebas dihapus dan diganti dengan callback destination yang terdaftar per tenant.
5. Bentuk akhir rerun: full rerun saja atau resume dari checkpoint yang aman.
6. Semantik status API untuk rejected/expired approval dan status transisi `cancelling`.
7. Endpoint audit export, evaluasi AI, RAG, serta admin platform yang masuk fase pertama/berikutnya.

Keputusan tersebut perlu dicatat dalam ADR/API contract review dan OpenAPI sebelum development client dimulai.

## 16. Ingress dan endpoint yang benar-benar tersedia

Bagian endpoint di dokumen ini adalah kontrak target; sebagian besar API publik multi-tenant belum diimplementasikan. Deployment Compose saat ini hanya meneruskan API Sprint 2 pada host `API_DOMAIN` dan n8n pada host `N8N_DOMAIN`. API menggunakan prefix `/api/v1`; metrics memakai `/metrics`.

Pada deployment production, Nginx mengarahkan HTTP ke HTTPS, membatasi ukuran request, menetapkan security headers, dan menolak akses publik ke `/metrics`. Prometheus mengakses metrics API/n8n langsung melalui jaringan internal Compose. Readiness/liveness tetap dapat diakses melalui API host dan hanya mengembalikan status dependency, bukan detail koneksi.

Jangan menganggap TLS ingress sebagai autentikasi/otorisasi API. API yang saat ini berjalan belum menyediakan user authentication, RBAC, tenant isolation, billing, atau public API contract penuh. Jangan mengekspos endpoint ke caller umum sampai kapabilitas tersebut tersedia dan diuji.
