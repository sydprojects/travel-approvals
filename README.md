# Travel Approvals

Work in progress. Full README (architecture diagram, how to run, accessibility
checks, "how this was built") lands once the feature slice is implemented.

## Structure

```
travel-approvals/
├── web/    Next.js (App Router, TypeScript strict) - UI + BFF route handlers
├── api/    Express - downstream "platform service" (unchanged business logic)
├── docs/   requirements.md - acceptance criteria written before tests/code
└── .github/workflows/  CI: lint, typecheck, unit, e2e, axe
```

The BFF lives inside `web/` as Next.js route handlers (`src/app/api/**`), not as
a separate service - it has no independent scaling or deployment need here, so
a third package would be indirection without benefit. It calls `api/` over
HTTP from the server side only; the browser never talks to `api/` directly.
