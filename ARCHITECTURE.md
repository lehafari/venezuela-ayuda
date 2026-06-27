# Architecture

Venezuela Ayuda combines a public crisis-response website with the central data
hub API used by partner sites and organizations. The backend goal is simple:
accept attributed reports safely, keep private fields private, and publish useful
public coordination data with clear provenance.

## System Shape

```text
Public users
  -> Next.js pages and Server Actions
  -> Supabase service writes through server code
  -> public pages read redacted views

Partner systems
  -> POST/PATCH /api/v1/reports with x-api-key
  -> authenticated partner source is stamped server-side
  -> Supabase RPC writes canonical rows and audit_log entries

Public readers and mirrors
  -> GET /api/v1/reports
  -> GET /api/v1/reports/{id}
  -> GET /api/v1/reports/{id}/history
  -> redacted projections only
```

## Runtime Layers

- `src/app/` contains Next.js routes, pages, layouts, API handlers, and Server
  Actions.
- `src/components/` contains public UI, forms, maps, admin views, and reusable
  controls.
- `src/lib/` contains backend policy and deterministic helpers: partner auth,
  report routing, validation, audit projection, rate limiting, Supabase clients,
  internal writes, and dedup helpers.
- `messages/{es,en}/` contains localized user-facing copy. Machine enum values
  stay stable across locales.
- `supabase/migrations/` is the database history and operational source of truth.
- `scripts/` contains Node tests, migration tools, backup tooling, and ingest or
  dedup utilities.
- `public/openapi.yaml` is the partner-facing API contract.

## Data Model

The API exposes one conceptual resource, `reports`, backed by current tables:

| API `type` | Table | Public view |
| --- | --- | --- |
| `missing_person` | `checkins` | `public_checkins` |
| `checkin` | `checkins` | `public_checkins` |
| `help_request` | `help_requests` | `public_help_requests` |
| `help_offer` | `help_offers` | `public_help_offers` |
| `damaged_building` | `damaged_reports` | `public_damaged_reports` |

`missing_person` and `checkin` share `checkins`; `status` separates them.

Operational tables include:

- `api_partners` for partner identity, hashed API keys, scopes, and active state.
- `audit_log` for append-only mutation history.
- `admin_emails` for Supabase-authenticated admin access.
- `applied_migrations` for database migration tracking.
- `collection_centers`, `sightings`, and `request_responses` for local
  coordination features.

## Write Paths

Public forms write through Server Actions. Partner systems write through
`/api/v1/reports`.

Both paths should preserve:

- server-side validation and normalization,
- private-field storage without public leakage,
- source attribution,
- auditability,
- idempotency where partner `external_id` applies,
- clear errors without raw database internals.

Partner write flow:

```text
Request
  -> content-type, size, rate-limit, request-id checks
  -> partner API key authentication
  -> buildRow/buildPatch validation
  -> Supabase RPC ingest_reports/patch_report/delete_report
  -> audit_log event in the same database transaction
  -> response with public projection or per-row result
```

## Read Paths

Public reads are intentionally open for coordination and mirroring. They must
remain redacted.

- Collection reads use `GET /api/v1/reports?type=...`.
- Item reads use `GET /api/v1/reports/{id}`.
- History reads use `GET /api/v1/reports/{id}/history`.

Routes select explicit public columns defined in `src/lib/reports.mjs`. History
projection uses `src/lib/audit.mjs` to show only public field changes, not raw
`before`/`after` audit snapshots.

## Privacy Boundary

Private fields include contact details, phone numbers, manage tokens, private
relay data, FR keys, Supabase service keys, raw audit snapshots, IP addresses,
user agents, and any production exports.

The main defense layers are:

- public views that omit private columns,
- explicit select lists in API code,
- `VIEW_COLUMNS` whitelists for route and audit projection,
- server-only writes with Supabase secret credentials,
- CORS that allows public GET reads but blocks browser writes with `x-api-key`,
- tests for API policy, partner auth, reports, ingest, patch, audit, and internal
  write helpers.

## Migrations and Environments

Database migrations are forward-only SQL files in `supabase/migrations/`.

GitHub workflows:

- `check-migrations.yml` checks whether migrations are already applied to the
  target branch database.
- `apply-migrations.yml` applies pending migrations on pushes to `main` and
  `staging`.
- `ingest.yml` keeps scheduled dedup paused and allows manual dedup runs.

`main` maps to production. `staging` maps to staging secrets when configured, and
normal PRs should target `staging` before promotion to production. The staging
review app is <https://venezuela-ayuda-staging.vercel.app/>.

## External Integrations

- Supabase stores canonical data, auth, PostGIS locations, RLS, RPCs, and views.
- Vercel hosts the Next.js app and applies configured security/CORS headers.
- OpenAI classification is optional; the app has fallback heuristics.
- FR-API integration is optional and server-side only.
- Map rendering uses MapLibre and a configurable map style URL.

## Design Principles

- Public coordination is not a source of official certification.
- Partner badges and sources mean attributed participation, not government
  endorsement.
- The backend should prefer deterministic rules over opaque automation.
- Data cleanup should be reviewable and reversible.
- Documentation and OpenAPI must change with API behavior.
