# Audit findings — before / after

Base: `140690e1ae4d1d67374fa41200dd2d3d07679744` → branch `fix/continuum-audit-hardening`

| ID | Finding (before) | Remediation (after) | Verified by |
| --- | --- | --- | --- |
| A | Concurrent POSTs could create multiple active runs / lose writes (JSON RMW) | Partial unique index one active run/loop; Idempotency-Key; 409 with existing; transactional SQLite | `tests/p0.test.ts` concurrency (50) + e2e |
| B | Invalid tags / bodies could persist and 500 later | Zod contracts; tags must be `string[]`; 422 | validation fuzz test + e2e 422 |
| C | `void executeRun()` — no durable job | `jobs` table, lease, recovery; `after()` is kick-only | durable jobs test |
| D | Unlocked whole-file JSON; silent reseed on parse error | SQLite WAL + transactions; integrity_check; refuse corrupt reopen | corruption no-reseed test |
| E | Global shared dataset | Signed demo session + `workspace_id` isolation | API session cookie + store schema |
| F | “Live” connectors / research / notify overstated | DEMO mode default; labels in UI/API/events/artifacts; honest settings | demo labeling test + UI banner |
| G | Acme $220k counted twice (brief + playbook) → ~$440k | `risk_entities` + unique portfolio sum = $268k | accounting uniqueness test |
| — | No automated regression suite | Vitest P0 + Playwright smoke | `npm test`, `npm run test:e2e` |
| — | No CI / Node pin | `.github/workflows/ci.yml`, `engines.node` | CI workflow |

## Deferred (documented honestly — not claimed passing)

| Test category | Status |
| --- | --- |
| Multi-instance Postgres failover | Deferred — SQLite demo profile; production blocked without `DATABASE_URL` |
| Full SSE reconnect matrix | Partial — SSE marked best-effort; polling is primary |
| Load / soak beyond 50 concurrent creates | Deferred |
| Connected-mode live Linkup/RocketRide | Deferred — no credentials; mode remains demo |
| Full a11y audit (axe) | Deferred — mobile nav + banner present; axe not automated yet |
| Guild/Snyk integration | Out of scope |
