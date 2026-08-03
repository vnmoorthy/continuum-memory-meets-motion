# Continuum — Open Loop OS

**Memory that moves. Debt you can burn.**

Continuum bridges long-term AI **Memory** with autonomous **Motion** by measuring and closing **Open Loop Debt** — unfinished work that chat logs forget and agents rarely finish.

Built for [Memory Meets Motion](https://luma.com/iu9svaun).

> **DEMO by default.** Simulations are labeled in the UI, APIs (`_meta.mode`), events, and artifacts. This is not a live multi-tenant production deployment unless you add Postgres (`DATABASE_URL`) and real connector credentials under `CONTINUUM_MODE=connected`.

![Continuum](./public/og.png)

---

## Quick start

```bash
# Node 20–24 (see package.json engines)
npm ci
npm run dev
```

Open **http://localhost:3000**

Optional env (see `.env.example`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `CONTINUUM_MODE` | `demo` | `demo` or `connected` |
| `CONTINUUM_SESSION_SECRET` | dev fallback | HMAC secret for demo session cookie |
| `CONTINUUM_DB_PATH` | `data/continuum.sqlite` | SQLite file (WAL) |
| `DATABASE_URL` | unset | Required for multi-instance production (Postgres) — **not implemented in demo profile** |

### Demo path (~90 seconds)

1. Landing — Continuum as Open Loop OS (note DEMO banner in `/app`)
2. `/app` — Open Loop Debt dashboard (**$268k** unique risk: Acme $220k + pilot $48k)
3. Click **Close My Morning** (or close the Acme renewal brief)
4. `/app/runs` — Cited Motion steps + artifact with `## Citations` (DEMO-labeled research/notify)
5. Debt drops; loop status → closed; artifact appears in the graph

---

## Safety model (post-audit)

| Invariant | Behavior |
| --- | --- |
| Concurrent runs | ≤1 active run per loop; `Idempotency-Key`; `409` returns existing |
| Validation | Zod; invalid `tags` → `422` |
| Jobs | Durable `jobs` rows + leases; crash recovery |
| Persistence | SQLite WAL transactions; no silent reseed on corruption |
| Auth | Signed httpOnly session; workspace-scoped data |
| Accounting | `risk_entities` — Acme ARR counted once |

Architecture decision: [`docs/adr/001-audit-hardening.md`](./docs/adr/001-audit-hardening.md)  
Before/after table: [`docs/AUDIT_BEFORE_AFTER.md`](./docs/AUDIT_BEFORE_AFTER.md)

---

## Scripts

```bash
npm run lint
npm run typecheck
npm test              # vitest P0 suite
npm run build
npm run test:e2e      # playwright smoke (needs build + playwright browsers)
npm run ci
```

---

## Product surface

| Route | Purpose |
| --- | --- |
| `/` | Brand landing |
| `/app` | Debt dashboard · graph · watchdogs · Close My Morning |
| `/app/memory` | Interactive graph · filter · add memory |
| `/app/loops` | Loop inbox · residue ingest |
| `/app/runs` | Runs · steps · citations · debt delta (poll + optional SSE) |
| `/app/settings` | Mode honesty · reset seed |

### APIs

All mutate/read paths are workspace-scoped via demo session cookie. Responses include `_meta: { mode, demo, label }`.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/metrics` | Open Loop Debt metrics (unique risk dollars) |
| `GET/PATCH/POST /api/watchdogs` | List / toggle / Scan now |
| `POST /api/morning` | Close My Morning |
| `GET/POST /api/runs` | Motion runs (`Idempotency-Key` supported) |
| `GET/POST /api/memory` | Graph snapshot / create / reset |
| `POST /api/ingest` | Residue → event + open loop |
| `GET /api/events?runId=` | Best-effort SSE (poll `/api/runs` as source of truth) |
| `GET /api/search` | Memory search |

---

## Stack

Next.js 16 · TypeScript · Tailwind 4 · Framer Motion · React Flow · **SQLite WAL** (`better-sqlite3`) · Zod · Vitest · Playwright

---

## Pitch materials

- Deck: [`slides/Continuum-Memory-Meets-Motion.pptx`](./slides/Continuum-Memory-Meets-Motion.pptx)
- 3-min storyboard: [`docs/PRESENTATION.md`](./docs/PRESENTATION.md)

```bash
npm run slides   # regenerate PowerPoint
```

---

## License

MIT © 2026 Continuum / Memory Meets Motion
