# Requirements - Travel Request Approvals

Written before any test or implementation code, per the project's workflow:
requirements first, then tests from these requirements, then implementation.
Every ID below must map to at least one passing test before the slice is
considered done (see the three exceptions in "Open decisions" at the end,
which stay red until a human decision fills them in).

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
  `pending -> approved | rejected` are legal transitions. `approved` and
  `rejected` are terminal - no further transition is accepted.

## Feature: List travel requests

- **REQ-LIST-1**: Visiting the requests page shows every travel request,
  most recently created first.
  Verified by: component test (Testing Library) + e2e.
- **REQ-LIST-2**: Each row shows requester, destination, dates, and status,
  with status visually distinguished by more than color alone (e.g. an
  icon or text label), not color alone.
  Verified by: component test + manual contrast/axe check.
- **REQ-LIST-3**: The requests list is reachable as a landmark region with
  a heading, in the page's normal heading order (no skipped levels).
  Verified by: jest-axe + manual heading-order check.

## Feature: View one travel request

- **REQ-VIEW-1**: Navigating to a request's detail page shows all of its
  fields, including `decisionNote` when present.
  Verified by: component test.
- **REQ-VIEW-2**: Requesting a nonexistent id shows a clear "not found"
  state, not a blank page or an unhandled crash.
  Verified by: component test (mocked 404 from BFF).

## Feature: Create travel request

- **REQ-CREATE-1**: The form has one labelled input per field
  (`requesterName`, `destination`, `startDate`, `endDate`, `reason`); every
  input's accessible name comes from a real `<label>`, not placeholder text
  alone.
  Verified by: jest-axe + component test querying by accessible role/name.
- **REQ-CREATE-2**: Submitting with any field invalid shows a specific,
  field-level error message, and that error is linked to its input via
  `aria-describedby` so screen readers announce it when the input is
  focused.
  Verified by: component test asserting the `aria-describedby` wiring.
- **REQ-CREATE-3**: Submitting a fully valid form creates the request with
  `status: "pending"` and navigates to (or shows) the new request.
  Verified by: e2e.
- **REQ-CREATE-4**: The submit button is disabled and labelled as busy
  (e.g. "Submitting…") while the request is in flight, and re-enabled on
  both success and failure - never left permanently disabled after an
  error.
  Verified by: component test.
- **REQ-CREATE-5**: Where the created request's confirmation/focus target
  lands, and what happens to the emptied form, is governed by
  **TODO(eduardo) - decision 1**, see "Open decisions" below. Until that
  decision is implemented, the e2e keyboard-only test for this step is
  expected to fail.

## Feature: Approve / reject travel request

- **REQ-APPROVE-1**: A `pending` request exposes an "Approve" and a
  "Reject" control; `approved`/`rejected` requests expose neither (the
  terminal-state rule from the domain model is visible in the UI, not just
  enforced server-side).
  Verified by: component test.
- **REQ-APPROVE-2**: Both controls are operable with keyboard alone (Tab to
  reach, Enter/Space to activate), with a visible focus indicator at every
  step.
  Verified by: Playwright keyboard-only e2e.
- **REQ-APPROVE-3**: After approving or rejecting, the status update is
  reflected in the UI without a full page reload, and is announced via the
  `aria-live` region (REQ-A11Y-5) so a screen reader user learns the
  outcome without having to re-read the page.
  Verified by: component test + manual screen-reader spot check.

## Cross-cutting: async states

Every view that fetches or mutates data must implement all four states
distinctly - this applies to list, detail, create, and approve/reject
alike:

- **REQ-STATE-1** (loading): a visible loading indicator while the request
  is in flight, not a blank screen.
- **REQ-STATE-2** (empty): a distinct "no data" message when a successful
  response contains zero items - not indistinguishable from the loading or
  error state. The exact empty-state copy and whether it offers a
  call-to-action (e.g. "Create your first request") is **TODO(eduardo) -
  decision 3**, see "Open decisions" below.
- **REQ-STATE-3** (error): a distinct, human-readable error message on
  failure, with no leaked stack traces or raw server error bodies.
- **REQ-STATE-4** (success): the normal populated view.

Verified by: component test per view, asserting each state renders
distinct, correct content.

## Cross-cutting: accessibility (WCAG 2.2 AA target)

- **REQ-A11Y-1**: Every page has semantic landmarks (`header`, `main`,
  `nav` if applicable) and exactly one `h1`, with no skipped heading
  levels.
  Verified by: jest-axe (landmark/heading rules) on every page.
- **REQ-A11Y-2**: Every interactive element is reachable by keyboard alone,
  in a logical tab order, with no keyboard trap.
  Verified by: Playwright keyboard-only e2e covering create -> approve.
- **REQ-A11Y-3**: Every focusable element has a visible focus indicator
  (not `outline: none` without a replacement).
  Verified by: manual check + Playwright screenshot diff on `:focus`.
- **REQ-A11Y-4**: Focus moves deliberately after a route change (to the new
  page's `h1` or main landmark) so keyboard/screen-reader users aren't left
  on a focus target that no longer exists.
  Verified by: component/e2e test asserting `document.activeElement` after
  navigation.
- **REQ-A11Y-5**: An `aria-live="polite"` region announces the result of
  async actions (create succeeded/failed, approve/reject succeeded/failed)
  without moving visual focus away from where the user was.
  Verified by: component test asserting the live region's text content
  updates.
- **REQ-A11Y-6**: Text and meaningful UI components meet WCAG 2.2 AA
  contrast (4.5:1 normal text, 3:1 large text/UI components) - checked with
  a contrast tool against the actual chosen palette, not assumed from
  "looks dark enough."
  Verified by: axe (`color-contrast` rule) + one manual spot check per
  color pairing used.
- **REQ-A11Y-7**: `@axe-core/playwright` reports zero violations on every
  page (list, detail, create, and the empty/error/loading variants where
  feasible to trigger in e2e).
  Verified by: Playwright + axe integration, one spec per page.

## Cross-cutting: BFF contract

- **REQ-BFF-1**: Every BFF route handler validates its input with a zod
  schema before calling the platform API; invalid input never reaches the
  downstream service.
  Verified by: unit test per route handler (valid + invalid payloads).
- **REQ-BFF-2**: The BFF never forwards the platform API's raw error body
  or stack trace to the browser. What shape a mapped error response takes
  (fields, granularity, whether validation errors and downstream failures
  look different) is **TODO(eduardo) - decision 2**, see "Open decisions"
  below. Until decided, the unit test asserting the mapped error shape is
  expected to fail.
- **REQ-BFF-3**: A downstream platform-API failure (timeout, 500, network
  error) results in a `5xx` from the BFF with the mapped shape from
  REQ-BFF-2, never an unhandled exception or a `200` with an error message
  in the body.
  Verified by: unit test with the platform API mocked to fail.

## Open decisions (TODO(eduardo))

These three are intentionally left unimplemented (stubbed so the rest of
the app compiles and runs). Each stub will make its associated test above
fail until you implement it - that's expected, not a bug.

1. **Focus management after create-submit** (REQ-CREATE-5). Trade-off:
   focusing the new request's heading is the more standard SPA pattern and
   confirms "something happened and here it is," but focusing back on the
   form (e.g. a confirmation message before the input) keeps the user in
   place if they're about to create several requests in a row. Neither is
   free from a screen-reader-announcement standpoint - decide which
   matters more for this workflow.

2. **BFF error-mapping shape** (REQ-BFF-2). Trade-off: a flat
   `{ error: string }` is simplest to render but throws away which field
   failed validation, forcing the form to show one generic error instead of
   per-field ones; a structured `{ error: string, fields?: Record<string,
   string> }` supports per-field messages (needed for REQ-CREATE-2) but is
   more mapping code and another shape to keep in sync with the zod schema.

3. **Empty-state copy and behaviour** (REQ-STATE-2). Trade-off: a plain
   "No travel requests yet" is honest and low-effort; adding a "Create your
   first request" call-to-action is more helpful but starts making UX
   decisions (should it link straight into the form? pre-fill anything?)
   that go beyond just reporting state.
