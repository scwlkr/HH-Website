# Fast Local Review

Use this loop for UI work. It is intentionally smaller than launch QA.

## Once Per Machine

```bash
npm install
npx playwright install chromium
```

## Iteration Loop

Keep the live site open:

```bash
npm run dev
npx playwright open http://127.0.0.1:3000
```

After a change, capture only touched routes:

```bash
npm run review -- /pricing
npm run review -- / /pricing /inquire
```

Plan Your Home has a public project-entry path in this build. Open it directly at
`http://127.0.0.1:3000/plan-your-home` or capture it with:

```bash
npm run review -- /plan-your-home
```

The active walkthrough uses its own focused shell with the h and h brand,
concise progress, and Save and exit. The shared marketing navigation and footer
remain available on other public routes but are intentionally absent here.

For final local qualification, run the complete browser scenario inside the
pinned Firebase emulator suite:

```bash
npm run proof:plan-home-final:emulator
```

The proof exercises all 35 questions, refresh/resume, the fake local email,
private references, review editing, submission, HHQ actions/deletion,
representative keyboard-only reduced-motion controls at phone and desktop
widths, 200%-equivalent reflow, and a commercial generic inquiry. It retains its
report, summary, screenshots, and traces under
`output/playwright/issue-18/final/`. The scenario enters only generated
RFC-reserved `.invalid` addresses, while the rendered site may include the exact
public contact address `hello@howethandharp.com`; it never uses real customer
contact data. Before passing, the script audits server logs, the summary and
report, and each retained trace's `trace.trace` and `trace.network` streams for
any other email-like value or the raw resume token. Screenshots are inspected
visually but are not OCR-audited.

Run `npm run proof:plan-home-scene-budget` after changing a scene. Each lazy
scene group is limited to 24 KiB of compressed JavaScript and CSS, and every
current-plus-next pair is limited to 48 KiB. The issue-18 baseline measured
2.21–3.57 KiB per group and 4.79–6.39 KiB per adjacent pair, so no exception is
currently required.

`npm run review` with no routes checks `/`, `/pricing`, `/projects`, `/faq`, and `/inquire`. It reuses the live server on port `3000`, or starts and stops an isolated dev server. Each route is checked at desktop and mobile sizes for HTTP failure, browser errors, and horizontal overflow.

Review these ignored artifacts:

- `output/playwright/latest/review-board.png` — one-image overview
- `output/playwright/latest/*.png` — full-page captures
- `output/playwright/latest/summary.json` — compact machine-readable result

Useful overrides:

```bash
REVIEW_VIEWPORTS=desktop npm run review -- /pricing
REVIEW_URL=http://127.0.0.1:3100 npm run review -- /pricing
```

## Gates

```bash
npm run lint && npm run typecheck
npm run qa:smoke
```

Use lint and typecheck before handoff. Use `qa:smoke` before merge when routes, forms, admin, metadata, links, or layout behavior changed; it builds production and uses isolated Firebase emulators.

## Plan Your Home Resume Email

Local and emulator browser proof uses the in-memory fake adapter only:

```bash
PLAN_HOME_RESUME_MAIL_TRANSPORT=fake
PLAN_HOME_RESUME_SECRET=<at-least-32-random-characters>
PLAN_HOME_PUBLIC_ORIGIN=http://localhost:3000
```

The fake mailbox is unavailable in production, retains messages only in the
running process, and removes a captured link when the local proof endpoint reads
it. Never print or retain a real/customer email address, resume link, or raw
token. Durable local QA may retain generated identities only under the
RFC-reserved `.invalid` domain; the final proof allowlists those fixtures and the
site's public contact address, and rejects any other email-like string or its raw
resume token in server logs, reports, and traces.

Production delivery is deliberately unconfigured. After h and h provides a
verified sending domain and API key, set `PLAN_HOME_RESUME_MAIL_TRANSPORT=resend`,
`PLAN_HOME_RESUME_EMAIL_FROM`, `RESEND_API_KEY`, `PLAN_HOME_RESUME_SECRET`, and an
HTTPS `PLAN_HOME_PUBLIC_ORIGIN`. Keep all except the public origin server-only.
Provider/domain configuration and DNS changes require separate authorization.

## Plan Your Home Retention Cleanup

The app exposes `GET` and `POST /api/internal/plan-your-home/cleanup` for an
external HTTPS scheduler. Set a unique server-only
`PLAN_HOME_CLEANUP_SECRET` of at least 32 characters and send it only as
`Authorization: Bearer <secret>`. Never put the secret in a query string, log,
browser variable, screenshot, issue, or chat.

Production scheduling is deliberately unconfigured. Before launch, configure
an approved provider scheduler to call the route regularly and give the app's
existing Firebase server identity permission to query and delete the scoped
Firestore records and list, inspect, and delete the scoped Storage objects.
Confirm the deployed Firestore indexes support the cleanup queries, monitor
failures without logging authorization headers or private client data, and run
the emulator cleanup proof before changing production state. Provider setup,
credentials, and schedule frequency require separate approval.

The published Privacy and Terms copy remains pending owner and counsel approval.
Do not treat the proposed 30-day local-snapshot, 180-day identified unfinished
server-draft, and 24-month submitted-inquiry windows as approved production
policy until that review is recorded. Cleanup configuration does not itself
satisfy the legal review gate.

Agent rule: inspect the changed-route screenshots before claiming UI completion. Never put secrets or private client data in screenshots.

## Plan Your Home Refinement Loop

Capture one deterministic state with generated `.invalid` fixture data:

```bash
npm run refine:plan-home -- q27
```

Named states are `welcome`, `contact`, `q1` through `q35`, `review`, and
`confirmation`. A focused run captures phone and desktop and targets 30
seconds. Run without a state for the phone-heavy representative board, all
Welcome/Entry/Living Room states (`q1` through `q11`), and deliberate Entry and
Living Room desktop samples; it targets two minutes:

```bash
npm run refine:plan-home
```

Each run replaces only `output/plan-home-refinement/latest/` and writes
`review-board.png`, the individual captures, and `summary.json`. The default
board also writes `pilot-motion-phone.webm`. When an approved comparison is in
`output/plan-home-refinement/pilot-original/`, it writes
`pilot-review-board.png`, a concise phone before/after and desktop adaptation
package. The summary records the available artifact names. It fails on a wrong
state, HTTP or request failure, browser or console error, horizontal overflow,
detectable WCAG violation, unnamed control, target smaller than 44px, an
interactive control obscured in the viewport, a question action dock outside the
initial viewport, or broken keyboard-driven Back/Next behavior.

The default matrix includes Q35, review, and confirmation at phone and desktop
sizes. Each review capture also proves keyboard edit/cancel return, inquiry
consent, one submission transition, and the resulting confirmation; its
checked-consent artifact is retained as `submission-phone.png` or
`submission-desktop.png` without calling Firebase.

The fixture requires the command's explicit development flag and a loopback
host. It cannot be enabled in a production build, never uses Firebase or email,
and remains separate from the retained Playwright proof. Automation is a
regression gate only; visual approval still comes from inspecting the board.
The internal `__motion=1` query used by the script enables motion only inside
this development fixture so the default run can retain a transition sample.
