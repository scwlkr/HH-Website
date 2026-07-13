# Plan Your Home Implementation Roadmap

## Purpose

This roadmap divides [Plan Your Home](plan-your-home-product-spec.md) into 18 small, sequential GitHub issues. Each issue must leave `main` working, prove its own slice, and be merged before the next issue begins.

The issue-creation prompt is [Create the implementation issues](prompts/plan-your-home-create-issues.md). The execution prompt is [Plan Your Home goal manager](prompts/plan-your-home-goal.md).

## Delivery Rules

- GitHub issues and their comments are the live execution record.
- While the milestone is unfinished, exactly one open issue has `next-step`; it is the only issue eligible for implementation.
- One worker owns one issue and one `codex/issue-<number>-<slug>` branch at a time.
- The manager never writes product code. It delegates, reviews proof, merges to `main`, comments the evidence, closes the issue, and advances `next-step`.
- Do not use a worktree unless the `$Using-Git-Worktrees` skill is available and explicitly used.
- Preserve unrelated local changes. Never reset, discard, overwrite, or casually stash user work.
- Every changed UI route is captured with `npm run review -- <route>` and the screenshots are inspected before completion.
- Production deployment, DNS, and public cutover are excluded. The final handoff is a locally running browser review.

## Standard Issue Body

Every issue created from this roadmap contains:

1. **Outcome** — one observable result.
2. **Scope** — only work required for that result.
3. **Non-goals** — adjacent work explicitly deferred.
4. **Dependencies** — earlier issue numbers or `None`.
5. **Done bar** — checkable behavior and tests.
6. **Proof** — commands, screenshots, and manual checks to include in the closing comment.

## Phase Map

| Order | Phase | Issue title | Depends on |
| ---: | --- | --- | --- |
| 1 | Foundation | Scaffold Plan Your Home and its isolated test harness | None |
| 2 | Foundation | Define the versioned 35-question registry and project-brief schemas | 1 |
| 3 | Foundation | Build deterministic tour navigation and local snapshots | 2 |
| 4 | Data | Add server draft checkpoints with revision-safe persistence | 2–3 |
| 5 | Experience | Build the accessible scene stage and shared prompt interactions | 2–3 |
| 6 | Experience | Deliver welcome, project frame, Living Room, and contact checkpoint | 4–5 |
| 7 | Experience | Deliver the Kitchen and Dining scene | 6 |
| 8 | Experience | Deliver the Primary Suite scene | 7 |
| 9 | Experience | Deliver the Bedrooms and Shared Bathrooms scene | 8 |
| 10 | Experience | Deliver the Laundry, Mudroom, Storage, and Systems scene | 9 |
| 11 | Experience | Deliver the Garage, Exterior, Site, Outdoor, and Specialty scene | 10 |
| 12 | Experience/Data | Deliver the Design Desk with secure files and links | 4, 11 |
| 13 | Experience/Data | Deliver review, edit, idempotent submission, and confirmation | 12 |
| 14 | Data | Add secure same-device and email-link draft resume | 4, 13 |
| 15 | Admin | Add the HHQ inquiry queue | 4, 13 |
| 16 | Admin | Add HHQ inquiry details, references, status, and deletion | 12, 15 |
| 17 | Integration | Route public entry, preserve generic inquiries, and add privacy, analytics, and retention | 13–16 |
| 18 | Quality | Complete accessibility, performance, full browser QA, and review handoff | 17 |

## Issue Contracts

### 1. Scaffold Plan Your Home and its isolated test harness

**Outcome:** `/plan-your-home` exists behind an internal entry point with an empty typed feature shell and fast automated test command, without changing the public inquiry route.

**Scope**

- Add the Plan Your Home feature/module boundary and route shell.
- Add a unit-test runner suitable for pure TypeScript registry/reducer tests and an `npm test` script.
- Add a route-local error boundary/loading behavior if the existing app pattern requires it.
- Add a temporary internal link that is easy to remove at cutover, or document the direct local URL.
- Add the route to the local review tooling without changing its default public route list yet.

**Non-goals:** Questions, persistence, illustrations, public CTA changes, HHQ.

**Done bar**

- The new feature does not import or extend the generic inquiry form domain.
- `/plan-your-home` renders on phone and desktop with no console error or horizontal overflow.
- One example test runs through `npm test`.

**Proof:** `npm test`; `npm run lint`; `npm run typecheck`; `npm run review -- /plan-your-home`; inspected mobile and desktop captures.

### 2. Define the versioned 35-question registry and project-brief schemas

**Outcome:** The exact product-spec questions have stable typed persistence and display contracts before UI work begins.

**Scope**

- Implement `plan-home-v1` definition, zones, 35 stable IDs, option slugs, response schemas, public copy, summaries, scene anchors, and camera keys.
- Define separate draft snapshot, reference metadata, and submitted project-brief schemas.
- Implement pure validation and human-readable answer summaries.
- Test all registry invariants stated in the product specification.

**Non-goals:** Form controls, artwork, Firestore, legacy record migration.

**Done bar**

- Exactly 35 contiguous questions and seven ordered zones pass invariant tests.
- Duplicate IDs/options, missing anchors, invalid uncertainty behavior, and incompatible defaults fail tests.
- Budget bands, square-footage bands, finish levels, limits, and public copy match the product spec.

**Proof:** focused registry/schema tests plus the standard non-UI gates.

### 3. Build deterministic tour navigation and local snapshots

**Outcome:** A pure state machine can complete, revisit, review, and restore the entire question path without UI or network coupling.

**Scope**

- Implement reducer/state commands for welcome, answer, next, back, zone completion, contact gate, review jump/return, and submission readiness.
- Enforce required answers, exclusivity, maximum selections, grouped values, and explicit uncertainty.
- Add a versioned local snapshot adapter with safe expiry/migration behavior.
- Exclude raw file blobs and sensitive resume tokens from local storage.

**Non-goals:** Server persistence, scene rendering, email resume.

**Done bar**

- Tests cover all 35 questions, backward edits, retained later answers, invalid progress, refresh restore, 30-day expiration, and unknown schema versions.
- Same-device restoration returns to the exact prompt.

**Proof:** focused reducer/snapshot tests plus the standard non-UI gates.

### 4. Add server draft checkpoints with revision-safe persistence

**Outcome:** Identified Plan Your Home drafts can be created and safely checkpointed through trusted server code.

**Scope**

- Add schema-version-2 `plan-your-home` records in `inquirySubmissions` while preserving legacy inquiries.
- Add server actions/repository methods for contact-gate creation and zone checkpoints.
- Use authenticated draft sessions, monotonic revision checks or Firestore transactions, and idempotency keys.
- Normalize searchable contact/summary fields and store canonical answers by stable ID.
- Add emulator tests for create, update, stale revision, retry, authorization, and legacy coexistence.

**Non-goals:** Resume email, attachments, HHQ pages, final submission.

**Done bar**

- Anonymous answers stay local until contact is supplied after question 6.
- A stale or repeated request cannot erase newer answers or duplicate a record.
- Direct browser Firestore/Storage access remains denied.

**Proof:** repository tests; Firebase emulator evidence; `npm run qa:smoke`; standard gates.

### 5. Build the accessible scene stage and shared prompt interactions

**Outcome:** A reusable phone-first stage can display any registered prompt inside a scene with correct semantics, focus, progress, navigation, and motion behavior.

**Scope**

- Build `SceneStage`, camera framing, progress, Back/Next, transition lifecycle, live announcements, and error handling.
- Build semantic renderers for choice, multiple choice, grouped choice, short text, counts, priority grouping, and references.
- Use one visible DOM prompt over decorative artwork.
- Implement keyboard support, 44 × 44 targets, 200% zoom behavior, and reduced-motion alternative.
- Add a neutral development scene for component tests only.

**Non-goals:** Final zone artwork/copy composition, persistence wiring beyond the feature interface.

**Done bar**

- Every control type works by touch and keyboard and exposes labels, instructions, selected state, limits, and errors.
- Focus moves predictably after prompt and zone transitions.
- Phone and wide layouts use the same interaction model and never expose a permanent split form.

**Proof:** component tests; keyboard/reduced-motion checks; route review screenshots; standard gates.

### 6. Deliver welcome, project frame, Living Room, and contact checkpoint

**Outcome:** A customer can begin a personalized home, answer questions 1–11, and create the first identified draft after question 6.

**Scope**

- Create bespoke exterior, entry, and living-room illustration layers and registered anchors.
- Type the customer's name onto the house plaque.
- Implement questions 1–11 exactly, including helper copy and limits.
- Insert email/phone checkpoint after question 6 with save/resume value and manual-follow-up disclosure.
- Connect local answers and server draft creation/checkpoint.
- Implement front-door and living-to-kitchen transition beats.

**Non-goals:** Automatic reminder, other zones, production email.

**Done bar**

- Before contact, no server record is created; after valid contact, one record contains welcome and questions 1–6.
- Refresh before and after contact restores correctly.
- Failed save is recoverable without losing local answers.
- Artwork remains decorative and all questions remain semantic.

**Proof:** focused tests; emulator record inspection; phone/desktop screenshots for welcome, an active prompt, and contact checkpoint; reduced-motion check; `npm run qa:smoke`; standard gates.

### 7. Deliver the Kitchen and Dining scene

**Outcome:** Questions 12–15 feel integrated into one illustrated kitchen/dining walkthrough and checkpoint at zone completion.

**Scope:** Bespoke scene, four anchors, exact prompt behavior, living-room turn-in, primary-hall transition, checkpoint, summaries, and tests.

**Non-goals:** Primary Suite or later art.

**Done bar:** Choice limits and grouped kitchen arrangement work; Back crosses the room boundary without loss; zone completion records once; reduced motion has no spatial move.

**Proof:** focused tests; checkpoint inspection; active-anchor and transition screenshots at both viewports; standard UI gates.

### 8. Deliver the Primary Suite scene

**Outcome:** Questions 16–19 work as a spatial primary-suite walkthrough and checkpoint at completion.

**Scope:** Bespoke scene and anchors, exact prompts/helper copy, kitchen-hall entrance, bedroom-hall exit, persistence and summaries.

**Non-goals:** Secondary-bedroom scene.

**Done bar:** All selections including explicit uncertainty validate; forward/back room transitions retain state; checkpoint is idempotent; semantics and reduced motion pass.

**Proof:** focused tests, checkpoint inspection, phone/desktop active-prompt screenshots, standard UI gates.

### 9. Deliver the Bedrooms and Shared Bathrooms scene

**Outcome:** Questions 20–21 clearly capture users/layout and bath sharing without visually multiplying rooms.

**Scope:** Representative bedroom-hall/bath scene, exact grouped prompts and Jack-and-Jill explanation, transitions, checkpoint, summaries, and tests.

**Non-goals:** Generating bedrooms based on count.

**Done bar:** Every customer sees the same representative scene; grouped user/layout answers validate independently; Back/Next and checkpoint work.

**Proof:** focused tests, checkpoint inspection, phone/desktop screenshots, standard UI gates.

### 10. Deliver the Laundry, Mudroom, Storage, and Systems scene

**Outcome:** Questions 22–25 work across one coherent utility-hall scene and checkpoint at completion.

**Scope:** Bespoke scene and anchors, exact prompts/limits, hall turn-in, exterior back-door reveal, checkpoint, summaries, tests.

**Non-goals:** Detailed system specifications or brands.

**Done bar:** Maximum selections and explicit uncertainty work; system choices do not imply engineering or price; state and transition behavior pass.

**Proof:** focused tests, checkpoint inspection, phone/desktop active-anchor and transition screenshots, standard UI gates.

### 11. Deliver the Garage, Exterior, Site, Outdoor, and Specialty scene

**Outcome:** Questions 26–30 capture exterior/site priorities with visual choices and transition naturally to the design desk.

**Scope:** Exterior/garage scene, visual style cards, exact grouped and limited prompts, disclaimers, back-door reveal, blueprint match cut, checkpoint, summaries, tests.

**Non-goals:** Rendering the selected style onto a customer-specific house or checking zoning feasibility.

**Done bar:** Style cards are accessible choices rather than promises; garage values and optional Other validate; fixed scene never reconfigures; checkpoint and transitions pass.

**Proof:** focused tests, checkpoint inspection, visual-card and transition screenshots at both viewports, standard UI gates.

### 12. Deliver the Design Desk with secure files and links

**Outcome:** Questions 31–34 work in the design-desk scene, including private direct uploads and safe reference links.

**Scope**

- Build design-desk artwork, four anchors, exact prompts, priority grouping, budget/timing context, and review transition.
- Add signed direct uploads for the approved file types and limits.
- Validate before upload and finalize; use private randomized object paths and metadata records.
- Add remove/retry/orphan behavior and safe normalized `http`/`https` links.
- Add optional note per reference and explicit no-reference answer.
- Checkpoint the completed zone.

**Non-goals:** Server-fetching URLs, public files, AI image analysis, price calculation.

**Done bar**

- PDF, image, and link success paths work; invalid type, size, scheme, and over-limit attempts fail clearly.
- Removing a file removes its metadata and object; failed/finalize-mismatched uploads are not retained.
- Upload progress, retry, keyboard operation, private access, priority alternative, and budget disclaimer pass.

**Proof:** focused and emulator storage tests; object/metadata inspection; phone/desktop screenshots; `npm run qa:smoke`; standard gates.

### 13. Deliver review, edit, idempotent submission, and confirmation

**Outcome:** A customer can review every answer, edit any zone, submit once, and receive a clear confirmation.

**Scope**

- Build grouped review summaries and edit/return behavior.
- Implement question 35, inquiry consent version, submission validation, and atomic status conversion.
- Prevent duplicate records or notifications on repeated requests.
- Add a Plan Your Home confirmation state/page without changing the generic thank-you contract unnecessarily.
- Expand emulator smoke coverage for complete submission.

**Non-goals:** HHQ UI, resume email, marketing consent.

**Done bar**

- Review shows all 35 responses and references in tour order.
- Editing an early answer preserves valid later answers and returns to review.
- Invalid/incomplete drafts cannot submit; double submit creates one submitted record.
- Submission language does not promise design, price, feasibility, or contract.

**Proof:** complete automated path; emulator record/status inspection; review and confirmation screenshots; `npm run qa:smoke`; standard gates.

### 14. Add secure same-device and email-link draft resume

**Outcome:** Customers can resume locally or explicitly request a secure cross-device resume link without creating an automated reminder system.

**Scope**

- Complete same-device exact restore and server reconciliation.
- Add `/plan-your-home/resume` with generic response behavior and rate limiting.
- Add 15-minute single-use hashed tokens, rotation, safe draft cookie, and last-synced-boundary restore.
- Add mail adapter with fake emulator/local delivery and documented Resend production configuration.
- Test missing, expired, used, tampered, and repeated tokens without account enumeration.

**Non-goals:** Automatic abandonment messages, customer accounts, marketing emails, production provider/DNS setup.

**Done bar:** Same-device and fake cross-device flows work; tokens and contact never leak in logs/URLs; replay fails; failures do not expose draft existence.

**Proof:** token/mail tests; fake email browser flow; security inspection; route screenshots; `npm run qa:smoke`; standard gates.

### 15. Add the HHQ inquiry queue

**Outcome:** Authorized h and h staff can review one clean list of legacy, draft, and submitted inquiries.

**Scope:** Add Inquiries navigation and authenticated list with name/contact, status, progress, last activity, location, status filter, last-activity sort, responsive empty/error states, and legacy handling.

**Non-goals:** Detail page actions, AI summaries, lead score, charts.

**Done bar:** Unauthorized access is rejected; seed/emulator data covers legacy, draft, submitted, reviewed, and spam; list remains usable on phone; no private answer appears in public routes.

**Proof:** admin authorization/list tests; HHQ phone/desktop screenshots; `npm run qa:smoke`; standard gates.

### 16. Add HHQ inquiry details, references, status, and deletion

**Outcome:** Authorized staff can inspect the literal project brief, open private references, update status, or delete the inquiry and files.

**Scope:** Ordered answer detail, contact/disclosure, progress/timestamps, expiring signed file access, safe external links, Reviewed/Spam actions, destructive confirmation, complete record/object deletion, and audit-safe errors.

**Non-goals:** Editing the customer's answers, AI summary, CRM automation.

**Done bar:** Authorization covers all reads/actions; signed file access expires and objects remain private; deletion removes record, tokens, and files; legacy details remain readable.

**Proof:** authorization/action/storage tests; HHQ detail screenshots; file/link/status/delete browser checks; `npm run qa:smoke`; standard gates.

### 17. Route public entry, preserve generic inquiries, and add privacy, analytics, and retention

**Outcome:** The site sends new single-family prospects into Plan Your Home while other projects retain a working generic intake, with required disclosure, measurement, and cleanup.

**Scope**

- Add a minimal project-start choice/routing step or equivalent clear entry that distinguishes new single-family from other work.
- Update relevant CTAs without breaking `/inquire` or generic submission.
- Add non-PII analytics events from the product spec.
- Update privacy/submission copy for drafts, local storage, references, manual follow-up, requested resume email, retention, deletion, and non-contract status.
- Add protected scheduled cleanup for expired drafts, tokens, records, and orphan files plus HHQ manual deletion compatibility.
- Document required counsel approval and production environment/provider prerequisites.

**Non-goals:** Deploying publicly, changing DNS, adding automated marketing, obtaining legal approval on h and h's behalf.

**Done bar:** Both public paths are obvious and functional; analytics payload tests exclude PII/answers; cleanup is idempotent and protected; privacy links/copy appear before data collection/submission; generic regression passes.

**Proof:** route and form browser tests; analytics inspection; cleanup emulator tests; privacy/entry screenshots; `npm run qa:smoke`; standard gates.

### 18. Complete accessibility, performance, full browser QA, and review handoff

**Outcome:** The entire local experience meets the final acceptance scenario and is left open in a browser for user review.

**Scope**

- Audit and fix the complete experience against the accessibility contract.
- Test current-plus-next scene loading, scene asset budgets, transition smoothness, and layout stability.
- Add one durable Playwright/emulator scenario covering the final acceptance path and generic inquiry regression.
- Exercise same-device refresh, fake email resume, uploads/links, review edits, submission, HHQ records/actions, reduced motion, keyboard, mobile, and desktop.
- Update canonical documentation and remove temporary development entry points.
- Start the supported local environment and open the review routes in the browser.

**Non-goals:** Production deployment, DNS, real resume-email credentials, visual changes unrelated to acceptance failures.

**Done bar**

- All ten final acceptance steps in the product spec have recorded evidence.
- No uncaught browser errors, failed requests, horizontal overflow, keyboard traps, inaccessible control names, or motion dependency remain.
- Each scene's compressed first-load contribution meets the agreed target or has a measured, documented exception.
- `main` is clean relative to the goal's work, the milestone issues are closed, and the local browser is ready for user review.

**Proof:** `npm test`; `npm run lint`; `npm run typecheck`; `npm run build`; `npm run qa:smoke`; `npm run review -- /plan-your-home /plan-your-home/resume /inquire /admin/inquiries`; inspected screenshots and summary; final Playwright trace/report; live local URL.

## Standard Gates

Use the smallest relevant checks while iterating, then close each issue with its full contract:

```bash
npm test
npm run lint
npm run typecheck
npm run review -- /changed-route
npm run qa:smoke
```

`qa:smoke` is mandatory for changes involving routes, forms, admin, metadata, links, layout, Firestore, Storage, Auth, or submission. Issue 18 also runs `npm run build` explicitly.

## Milestone Completion

The milestone is complete only when all 18 issues are closed with proof, their work is merged to `main`, there is no remaining `next-step` issue, the full acceptance scenario passes locally, and `/plan-your-home` is open for the user's browser review. A deployed production release is a separate, explicitly authorized goal.
