# Contributing to Continuum

Thanks for wanting to make Open Loop Debt go down.

## Ground rules

1. **Be honest about DEMO vs connected.** Never invent live provider results.
2. **Keep P0 invariants.** One active run per loop, Zod validation, leased jobs, unique risk accounting.
3. **Small PRs.** Prefer focused changes with tests.
4. **No secrets in commits.** Use `.env.local` (see `.env.example`).

## Dev setup

```bash
git clone https://github.com/vnmoorthy/continuum-memory-meets-motion.git
cd continuum-memory-meets-motion
npm ci
cp .env.example .env.local
npm run dev
```

Node **20–24** required (`package.json` → `engines`).

## Checks before you open a PR

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Optional: `npm run test:e2e` (Playwright).

## Where to contribute

| Area | Path |
| --- | --- |
| UI / design system | `src/app`, `src/components`, `src/app/globals.css` |
| Motion runtime | `src/lib/motion` |
| Sponsor adapters | `src/lib/sponsors` |
| Persistence / jobs | `src/lib/store`, `src/lib/jobs` |
| Docs / deck | `docs/`, `scripts/generate-slides.js` |

## PR checklist

- [ ] Tests updated or added for behavior changes
- [ ] Docs / README touched if user-facing
- [ ] No winner/prize claims or fabricated metrics
- [ ] `npm run ci` passes locally

## Code of conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
