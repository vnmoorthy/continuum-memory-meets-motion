# ADR-001: Continuum audit hardening — durable demo-safe architecture

- **Status:** Accepted
- **Date:** 2026-08-03
- **Base commit:** `140690e1ae4d1d67374fa41200dd2d3d07679744`
- **Branch:** `fix/continuum-audit-hardening`

## Context

The Memory Meets Motion Continuum demo had strong UX but was unsafe for public deployment:

- Whole-file JSON RMW without locking (lost concurrent writes)
- Fire-and-forget `void executeRun()` with no durable job record
- Global mutable dataset with no workspace isolation
- Weak/absent validation (invalid tags → later 500s)
- Misleading “live” connector UI and research/notify claims
- Financial double-count of Acme $220k ARR across related open loops
- Silent reseed on parse errors hiding corruption

Next.js 16 docs (`node_modules/next/dist/docs`, including `after`) were consulted. `after()` is a post-response scheduling hint only — not durability.

## Decision

Default **hackathon-honest** profile:

| Concern | Choice |
| --- | --- |
| Mode | `CONTINUUM_MODE=demo` (default). Connected mode reserved for real credentials. |
| Persistence | SQLite WAL via `better-sqlite3`, transactional writes, per-workspace rows |
| Multi-instance | **Blocked** without `DATABASE_URL` Postgres (documented). Local/demo = single Node process. |
| Jobs | `jobs` table with lease + startup recovery; `after()` only kicks the worker |
| Auth | Signed httpOnly demo session cookie; `workspace_id` on all rows |
| Validation | Zod on API bodies; tags must be `string[]` → 422 |
| Runs | Partial unique index: ≤1 active run/loop; `Idempotency-Key`; 409 returns existing; never 201 unreadables |
| Accounting | `risk_entities` + `riskEntityId` on loops; portfolio dollars unique by entity |
| Truth | DEMO labels in UI, API `_meta`, events, artifacts, settings |

## Consequences

- Public multi-user / multi-instance production requires Postgres + real auth — out of scope for this ADR; deploy without `DATABASE_URL` must stay single-process demo.
- `better-sqlite3` is a native module (`serverExternalPackages`).
- Tests use isolated temp DB files (`CONTINUUM_DB_PATH`) and `CONTINUUM_AUTO_WORKER=0`.

## Alternatives considered

1. Keep JSON file + mutex — insufficient under multi-request races and corruption semantics.
2. Rely solely on `after()` for jobs — not durable across crash/restart.
3. Postgres-only — correct for multi-instance, heavier than needed for local demo profile.
