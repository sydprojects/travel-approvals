# Travel Approvals

A small, full-stack travel-request approvals app: list requests, view one,
create one, approve or reject it.

**Live demo:** https://demo.sydprojects.com/travel-approvals

## What it is

- **`web/`** - Next.js (App Router, TypeScript strict mode). The UI, plus a
  thin BFF layer implemented as Next.js route handlers.
- **`api/`** - Express, plain JS. Plays the role of an existing downstream
  "platform service" the BFF sits in front of. Its business logic (the
  travel-request domain, validation rules, the pending-to-approved/rejected
  transition rule) is independent of the UI.
- **`docs/requirements.md`** - acceptance criteria written before any test
  or component code, each tagged with an ID and which test file verifies it.

## Architecture

```mermaid
flowchart LR
    Browser -->|HTTP| UI["Next.js UI<br/>(Server + Client Components)"]
    UI -->|same-origin fetch| BFF["BFF route handlers<br/>web/src/app/api/**<br/>(zod validation, error mapping)"]
    BFF -->|HTTP, server-side only| API["Node/Express<br/>platform service<br/>(api/)"]
```

The BFF is not a separate deployable service; it is Next.js route handlers
living inside `web/`. It has no independent scaling or deployment need here,
so a third package would be indirection without benefit. The browser never
talks to `api/` directly; only the BFF does, from the server side.

Server Components fetch initial page data (list, detail) by calling the same
data-access module the BFF uses, directly, without a self-referential HTTP
round trip. Client-side mutations (create, approve, reject) go through the
BFF's `/api/**` route handlers, which is where zod validation and error
mapping actually live.

## Run it

### Docker

```bash
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:4000

### Locally, without Docker

```bash
cd api && npm install && npm start        # http://localhost:4000
cd web && npm install && npm run dev      # http://localhost:3000
```

## Tests

```bash
cd api && npm test                        # Node's built-in test runner + supertest
cd web && npm test                        # Vitest + Testing Library + jest-axe
cd web && npm run e2e                     # Playwright, incl. @axe-core/playwright
```

## Responsive

Checked with Playwright at a 375px phone viewport across every page: no
horizontal overflow, and the create form's date-input row stacks to one
column below 480px instead of squeezing two native date pickers into an
unusably narrow track (`web/e2e/responsive.spec.ts`).

## Accessibility

Target: WCAG 2.2 AA. Checked with tooling, not assumed:

- **jest-axe** on components in isolation (Vitest).
- **@axe-core/playwright** against every real page in a real browser (home,
  detail, create, create-with-errors).
- A **keyboard-only Playwright test** drives the full create -> approve flow
  with no mouse: Tab/Enter/typing only, asserting focus lands on expected
  controls at each step, plus a dedicated no-keyboard-trap check on every
  page tabbing forward and back.
- Landmarks and heading order: one `h1` per page, a labelled `region` for
  the request list, `nav` for primary navigation.
- Every form input has a real `<label>`; validation errors are linked via
  `aria-describedby`, and focus moves to the first invalid field on an
  invalid submit.
- Focus moves deliberately to each page's heading after a client-side route
  change, including after a successful create (which also announces
  "Request created." through a persistent `role="status"` region).
- Async outcomes (create, approve, reject) are announced through an
  `aria-live="polite"` region.

## Decisions

### Focus and announcement after submitting the form (REQ-CREATE-5)

- Success: I navigate the user to /requests/{id}?created=1. I move focus to the h1, "Travel request: [name]", and use a role="status" region that exists from the initial render to announce "Request created.". I then clear the URL parameter so refreshing the page does not announce the message again.
- Error: for both client-side and server-side validation errors, I move focus to the first invalid field in visual order, while keeping the error summary in aria-live.
- Why I chose this approach: previously, the success message was written into a node that disappeared during navigation, so it was never announced. On validation errors, keyboard users were left focused on the submit button without knowing which field needed attention. I changed the focus behaviour so it moves directly to the place where the user needs to act.
- What I rejected: I considered adding a GOV.UK-style error summary at the top of the form, but decided against it because it would add unnecessary complexity for a form with only five fields.

### BFF error mapping (REQ-BFF-2 and 3)

- I added a fixed mapping table with application-owned messages:

  - 400 → 400 "Some details could not be accepted."
  - 404 → 404 "Request not found."
  - 409 → 409 "This request has already been decided."
  - timeout → 504 "The service took too long. Please try again."
  - everything else → 502 "The service is unavailable. Please try again."
- I designed mapDownstreamError(status) so it receives only the downstream status code and never the API response body. This prevents internal API messages from leaking through the BFF. I implemented this behaviour by first writing the failing tests and then making the implementation pass them.
- I also added a 5-second timeout, configurable through PLATFORM_TIMEOUT_MS, with timeout detection handled in platformApi.ts. I deliberately kept timeout detection separate from error translation so each responsibility remains isolated.
- For field-level validation messages, I moved the messages into lib/messages.ts and use that as the single source of truth for both the client and Zod. This means the user sees the same validation message regardless of where the error originates.
- Why I made these changes: previously, an API 400 was being translated into a 502, the 409 response could expose text coming directly from the downstream API, and the timeout required by the specification had not been implemented.

### Empty state (REQ-STATE-2)

- I kept "Create your first request" as the empty-state message.

- Why: the application currently has no role-based behaviour, so creating a request is the only useful action available when the list is empty. If approver roles are introduced later, I would change this message to something appropriate for that context, such as "Nothing to review".

### How this was built

- Wrote `docs/requirements.md` first: every acceptance criterion got an ID
  and a named test file, before any test or component existed.
- Built test-first per slice: a failing test against a not-yet-existing
  component or route handler, confirmed red, then the implementation to
  turn it green.
- Built with an agentic workflow (Claude Code, with Codex handling one
  piece), with my own review at each step rather than at the end.
- Playwright e2e and axe caught two real bugs unit tests missed entirely: a
  Server Component passing a function prop to a Client Component (silently
  broke the detail page), and a 3.29:1 contrast failure on the Approve
  button (fixed to 5.02:1).
- One agent-written e2e test (keyboard-trap detection) was flaky; found and
  fixed the actual root cause (a wrap-to-`document.body` case the test
  wasn't accounting for), not just retried until green.
- Verified `docker compose up` actually builds and runs both services from
  a clean clone, not just the working copy.

No invented users, metrics, or production claims beyond what's stated above.
