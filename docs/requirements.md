# Requirements - Travel Request Approvals

Written before any test or implementation code, per the project's workflow:
requirements first, then tests from these requirements, then implementation.
Every ID below maps to at least one passing test. Three requirements
(REQ-CREATE-5, REQ-BFF-2, REQ-STATE-2) were originally stubbed as open
product/UX decisions for a human to resolve later; see "Resolved
decisions" at the end for what was chosen and why.

## Domain model

```ts
type TravelRequestStatus = "pending" | "approved" | "rejected";

type TravelRequest = {
  id: number;
  requesterName: string;
  destination: string;
  startDate: string;   // ISO date, e.g. "2026-10-01"
  endDate: string;     // ISO date
  reason: string;
  status: TravelRequestStatus;
  createdAt: string;   // ISO datetime
  decisionNote?: string; // set when approved/rejected
};
```

Validation rules (enforced by the BFF, not trusted from the client):

- `requesterName`: non-empty, 2-80 characters after trimming.
- `destination`: non-empty, 2-80 characters after trimming.
- `reason`: non-empty, 10-500 characters after trimming.
- `startDate`, `endDate`: valid ISO dates; `startDate <= endDate`.
- `status`: one of the three values above; only `pending -> approved` and
  `pending -> rejected` are legal transitions. `approved` and `rejected`
  are terminal - no further transition is accepted.

## Feature: List travel requests

- **REQ-LIST-1**: Visiting the requests page shows every travel request,
  most recently created first.
  Verified by: `web/src/components/TravelRequestList.test.tsx` + `web/e2e/axe.spec.ts`.
- **REQ-LIST-2**: Each row shows requester, destination, dates, and status,
  with status visually distinguished by more than color alone (e.g. an
  icon or text label), not color alone.
  Verified by: `web/src/components/TravelRequestList.test.tsx` + axe's `color-contrast` rule in `web/e2e/axe.spec.ts`.
- **REQ-LIST-3**: The requests list is reachable as a landmark region with
  a heading, in the page's normal heading order (no skipped levels).
  Verified by: `web/src/components/TravelRequestList.test.tsx` (jest-axe) + `web/e2e/axe.spec.ts` (heading order).

## Feature: View one travel request

- **REQ-VIEW-1**: Navigating to a request's detail page shows all of its
  fields, including `decisionNote` when present.
  Verified by: `web/src/components/TravelRequestDetail.test.tsx`.
- **REQ-VIEW-2**: Requesting a nonexistent id shows a clear "not found"
  state, not a blank page or an unhandled crash.
  Verified by: `web/src/components/TravelRequestDetail.test.tsx` (mocked 404 from BFF).

## Feature: Create travel request

- **REQ-CREATE-1**: The form has one labelled input per field
  (`requesterName`, `destination`, `startDate`, `endDate`, `reason`); every
  input's accessible name comes from a real `<label>`, not placeholder text
  alone.
  Verified by: `web/src/components/CreateRequestForm.test.tsx` (jest-axe + accessible role/name queries).
- **REQ-CREATE-2**: Submitting with any field invalid shows a specific,
  field-level error message, and that error is linked to its input via
  `aria-describedby` so screen readers announce it when the input is
  focused.
  Verified by: `web/src/components/CreateRequestForm.test.tsx` (asserts the `aria-describedby` wiring).
- **REQ-CREATE-3**: Submitting a fully valid form creates the request with
  `status: "pending"` and navigates to (or shows) the new request.
  Verified by: `web/src/app/api/requests/route.test.ts` + `web/e2e/keyboard-flow.spec.ts`.
- **REQ-CREATE-4**: The submit button is disabled and labelled as busy
  (e.g. "Submitting…") while the request is in flight, and re-enabled on
  both success and failure - never left permanently disabled after an
  error.
  Verified by: `web/src/components/CreateRequestForm.test.tsx`.
- **REQ-CREATE-5**: After a successful create, navigate to
  `/requests/{id}?created=1`. The destination page has a persistent
  `role="status"` region, empty on first paint; on mount, if `created=1`,
  it announces "Request created." and the query param is stripped via
  `router.replace` so a refresh does not repeat the announcement. Focus
  lands on the page's `h1`, which names the requester, so keyboard and
  screen-reader users land somewhere that concretely confirms which
  request was created (decision 1, resolved - see "Resolved decisions").
  On an invalid submit (client-side or server-returned field errors),
  focus moves to the first invalid field in visual order (requesterName,
  destination, startDate, endDate, reason); the aria-live summary message
  is kept alongside it.
  Verified by: component tests asserting focus-to-first-invalid for both
  client and server errors (`web/src/components/CreateRequestForm.test.tsx`);
  e2e asserting the focused `h1` text and the status region's text after
  create-submit (`web/e2e/keyboard-flow.spec.ts`).

## Feature: Approve / reject travel request

- **REQ-APPROVE-1**: A `pending` request exposes an "Approve" and a
  "Reject" control; `approved`/`rejected` requests expose neither (the
  terminal-state rule from the domain model is visible in the UI, not just
  enforced server-side).
  Verified by: `web/src/components/TravelRequestDetail.test.tsx`.
- **REQ-APPROVE-2**: Both controls are operable with keyboard alone (Tab to
  reach, Enter/Space to activate), with a visible focus indicator at every
  step.
  Verified by: `web/e2e/keyboard-flow.spec.ts`.
- **REQ-APPROVE-3**: After approving or rejecting, the status update is
  reflected in the UI without a full page reload, and is announced via the
  `aria-live` region (REQ-A11Y-5) so a screen reader user learns the
  outcome without having to re-read the page.
  Verified by: `web/src/components/TravelRequestDetail.test.tsx` + `web/e2e/keyboard-flow.spec.ts` (aria-live text asserted in a real browser).

## Cross-cutting: async states

Every view that fetches or mutates data must implement all four states
distinctly - this applies to list, detail, create, and approve/reject
alike:

- **REQ-STATE-1** (loading): a visible loading indicator while the request
  is in flight, not a blank screen.
  Verified by: component test on each route's `loading.tsx`.
- **REQ-STATE-2** (empty): a distinct "no data" message when a successful
  response contains zero items - not indistinguishable from the loading or
  error state - including a "Create your first request" call-to-action
  (decision 3, resolved - see "Resolved decisions").
  Verified by: `web/src/components/TravelRequestList.test.tsx` (asserts the message and the CTA link's `href`).
- **REQ-STATE-3** (error): a distinct, human-readable error message on
  failure, with no leaked stack traces or raw server error bodies.
- **REQ-STATE-4** (success): the normal populated view.
  Verified by: no dedicated test of its own - exercised as the baseline
  render in nearly every other component and e2e test (e.g. the axe suite
  navigates each page in its normal populated state).

Verified by: component test per view, asserting each state renders
distinct, correct content.

## Cross-cutting: responsiveness

- **REQ-RESPONSIVE-1**: Every page renders with no horizontal overflow at
  a common phone width (375px), and the create form's side-by-side
  start/end date inputs stack to one column below 480px rather than
  squeezing two native date inputs into an unusably narrow track.
  Verified by: Playwright e2e checking `scrollWidth <= clientWidth` and
  the date row's computed `grid-template-columns` at a 375px viewport
  (`web/e2e/responsive.spec.ts`).

## Cross-cutting: accessibility (WCAG 2.2 AA target)

- **REQ-A11Y-1**: Every page has semantic landmarks (`header`, `main`,
  `nav` if applicable) and exactly one `h1`, with no skipped heading
  levels.
  Verified by: Playwright e2e asserting exactly one `h1`/`header`/`main`
  per page, plus axe's landmark/region/heading-order rules in the same
  pass (`web/e2e/axe.spec.ts`).
- **REQ-A11Y-2**: Every interactive element is reachable by keyboard alone,
  in a logical tab order, with no keyboard trap.
  Verified by: Playwright keyboard-only e2e covering create -> approve
  (`web/e2e/keyboard-flow.spec.ts`), plus a dedicated no-trap check on
  every page tabbing forward and back (`web/e2e/no-keyboard-trap.spec.ts`).
- **REQ-A11Y-3**: Every focusable element has a visible focus indicator
  (not `outline: none` without a replacement).
  Verified by: Playwright e2e checking computed `outline`/`box-shadow`
  after keyboard focus on real controls, not visual inspection
  (`web/e2e/focus-visible.spec.ts`).
- **REQ-A11Y-4**: Focus moves deliberately after a route change (to the new
  page's `h1` or main landmark) so keyboard/screen-reader users aren't left
  on a focus target that no longer exists.
  Verified by: `web/e2e/keyboard-flow.spec.ts` and `web/e2e/no-keyboard-trap.spec.ts` (both assert `document.activeElement` after navigation).
- **REQ-A11Y-5**: An `aria-live="polite"` region announces the result of
  async actions (create succeeded/failed, approve/reject succeeded/failed)
  without moving visual focus away from where the user was.
  Verified by: `web/src/components/CreateRequestForm.test.tsx` and `web/src/components/TravelRequestDetail.test.tsx` (assert the live region's text content updates).
- **REQ-A11Y-6**: Text and meaningful UI components meet WCAG 2.2 AA
  contrast (4.5:1 normal text, 3:1 large text/UI components) - checked with
  a contrast tool against the actual chosen palette, not assumed from
  "looks dark enough."
  Verified by: axe's `color-contrast` rule in e2e, plus every color
  pairing actually used in the app checked with a WCAG contrast formula
  (all 12 pairings pass at 4.5:1; see the PR/commit for the full table).
- **REQ-A11Y-7**: `@axe-core/playwright` reports zero violations on every
  page (list, detail, create, and the empty/error/loading variants where
  feasible to trigger in e2e).
  Verified by: `web/e2e/axe.spec.ts` (one spec per page), plus
  `web/src/components/TravelRequestList.test.tsx` (jest-axe, empty state).

## Cross-cutting: BFF contract

- **REQ-BFF-1**: Every BFF route handler validates its input with a zod
  schema before calling the platform API; invalid input never reaches the
  downstream service.
  Verified by: `web/src/app/api/requests/route.test.ts` + `web/src/app/api/requests/[id]/route.test.ts` (valid + invalid payloads).
- **REQ-BFF-2**: The BFF never forwards the platform API's raw error body
  or stack trace to the browser. Validation failures return a structured
  `{ error, fields }` shape so the form can show per-field messages
  (decision 2, resolved - see "Resolved decisions"). Downstream failures
  are mapped to a fixed status and message by `mapDownstreamError(status)`
  per this table, which takes only a status code, never the downstream
  body, so a leak is impossible by construction rather than by discipline:

  | Downstream condition | Mapped status | Message |
  | --- | --- | --- |
  | 400 | 400 | "Some details could not be accepted." |
  | 404 | 404 | "Request not found." |
  | 409 | 409 | "This request has already been decided." |
  | timeout | 504 | "The service took too long. Please try again." |
  | network / 5xx / anything else | 502 | "The service is unavailable. Please try again." |

  `mapDownstreamError` (implemented by Eduardo, `web/src/lib/mapError.ts`)
  via a status-to-message lookup; any status outside the table falls back
  to the 502 entry.
  Verified by: `web/src/lib/mapError.test.ts` (one test per table row,
  plus a leak-safety invariant). `web/src/app/api/requests/route.test.ts`
  additionally asserts the exact message text matches `lib/messages.ts`,
  not zod's default copy.
- **REQ-BFF-3**: A downstream platform-API failure (timeout, 500, network
  error) results in a `5xx` from the BFF with the mapped shape from
  REQ-BFF-2, never an unhandled exception or a `200` with an error message
  in the body. `platformApi.ts` distinguishes a stalled request (mapped to
  504) from an outright network failure (mapped to 502) via
  `AbortSignal.timeout(PLATFORM_TIMEOUT_MS)` (default 5000ms, configurable
  via the `PLATFORM_TIMEOUT_MS` env var) before `mapDownstreamError` ever
  sees the status.
  Verified by: `web/src/lib/platformApi.test.ts` (timeout path via a
  fetch mock that only resolves on abort, and a network-failure path);
  the "never an unhandled exception" half is covered end to end now that
  `mapDownstreamError` (REQ-BFF-2) is implemented.

## Resolved decisions

These three were originally stubbed as open product/UX decisions, each
with a documented trade-off. This section records what was chosen and
why, so the reasoning survives even though the trade-off framing is no
longer live in the code. Last revised 2026-10-02.

1. **Focus and announcement after submitting the form** (REQ-CREATE-5).
   Chosen: on success, navigate to `/requests/{id}?created=1`. Focus
   lands on the `h1`, `Travel request: [name]`, and a `role="status"`
   region, present from the initial render, announces "Request created.".
   The query parameter is then stripped via `router.replace` so a refresh
   does not repeat the announcement. On an invalid submit, whether
   client-side or server-returned, focus moves to the first invalid field
   in visual order, while the error summary remains in `aria-live`.
   Reasoning: the earlier version wrote the success message into a node
   that unmounted on navigation, so it was never announced; on error,
   keyboard users were left focused on the submit button with no
   indication of which field needed correction. Moving focus to where
   action is needed addresses both. Considered and not used: a
   GOV.UK-style error summary at the top of the form, since it would add
   more code than a five-field form needs.

2. **BFF error-mapping shape** (REQ-BFF-2, REQ-BFF-3). Chosen: a fixed
   status-to-message table.
   - 400 -> 400 "Some details could not be accepted."
   - 404 -> 404 "Request not found."
   - 409 -> 409 "This request has already been decided."
   - timeout -> 504 "The service took too long. Please try again."
   - everything else -> 502 "The service is unavailable. Please try
     again."

   `mapDownstreamError(status)` receives only the status code, never the
   downstream response body, so internal API text cannot leak through
   regardless of implementation. The 5 second platform timeout
   (configurable via `PLATFORM_TIMEOUT_MS`) is detected in
   `platformApi.ts`; detection and error-message translation are kept as
   separate concerns. Field-level messages come from `lib/messages.ts`, a
   single source of truth used by both client-side validation and the zod
   schemas, so the message is identical regardless of where the
   validation error originates. Reasoning: previously, a downstream 400
   would have mapped to a generic 502, a 409 response would have
   forwarded the platform API's own text, and no timeout handling existed
   despite being part of the specification.

3. **Empty-state copy and behaviour** (REQ-STATE-2). Chosen: add a "Create
   your first request" call-to-action linking to `/requests/new`, not a
   plain message. Reasoning: this app's only real action from an empty
   list is "create one" - a dead-end message costs the user an extra trip
   to the nav bar for no reason, and the CTA's target and copy are
   unambiguous enough that this didn't turn into an open-ended UX
   exploration the way a richer empty state (illustrations, tips) might
   have.
