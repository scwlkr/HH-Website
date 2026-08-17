# Internal Agent Index

Use this task-based index at the start of repository work. It routes agents to authoritative documentation and source ownership; it does not replace those sources. Shared public-safe terminology lives in [docs/agent-guidance/CONTEXT.md](../agent-guidance/CONTEXT.md). Repository operations remain internal and must never be copied into public agent artifacts.

## Brand and public content

**Authoritative sources:** [AGENTS.md](../../AGENTS.md) for naming rules, [docs/style-guide.md](../style-guide.md) for brand and writing direction, [docs/agent-guidance/CONTEXT.md](../agent-guidance/CONTEXT.md) for shared agent language, `lib/site-config.ts` for business identity and contact facts, and `lib/content/` for marketing, FAQ, finish-level, and build-type content.

**Source ownership:** Edit shared business facts in `lib/site-config.ts`; edit reusable public copy and registries in `lib/content/`. Do not maintain unrelated copies inside pages or public agent documents.

**Safeguards:** Use Howeth and Harp, h and h, H and H, or HH; never use an ampersand in the business name. Do not invent services, prices, guarantees, project facts, or legal approval.

**Verification:** Run `npm test`, `npm run lint`, and `npm run typecheck`. Capture affected public routes with `npm run review -- <routes>` and inspect the resulting screenshots.

## Routes, metadata, and discovery

**Authoritative sources:** `lib/agent-guidance/public-routes.ts` owns the intentionally indexable inventory. `lib/metadata.ts`, `app/sitemap.ts`, `app/robots.ts`, `proxy.ts`, and `lib/agent-guidance/` own metadata, XML discovery, crawler guidance, content negotiation, and agent-readable representations.

**Source ownership:** Add or remove indexable route facts in the typed inventory, then keep page metadata and semantic Markdown renderers aligned with the human page's existing content registries. `components/layout/site-footer.tsx` owns visible discovery links.

**Safeguards:** Indexability policy wins. Never surface noindex, private, administrative, transactional, internal API, draft, or legacy content merely to expand discovery. Public artifacts must not contain repository procedures, environment details, credentials, client data, or operating authority.

**Verification:** Run `npm run typecheck`, `npm run review -- /`, and `npm run qa:smoke`. Inspect HTTP content types, canonical links, CORS, cache headers, sitemap parity, footer screenshots, and publication boundaries.

## Shared layouts and visuals

**Authoritative sources:** [docs/style-guide.md](../style-guide.md), `app/globals.css`, `components/layout/`, `components/marketing/`, and the nearest feature-specific context or ADR. Use [docs/devops.md](../devops.md) for the screenshot-review loop.

**Source ownership:** Shared marketing chrome belongs in `components/layout/`; reusable public sections belong in `components/marketing/`; route composition remains in `app/`. Preserve established component and utility-class patterns.

**Safeguards:** Keep responsive hierarchy, 44-pixel touch targets, accessible names, keyboard behavior, and the existing visual system. Never infer visual completion from tests without inspecting phone and desktop captures.

**Verification:** Run `npm run review -- <routes>`, inspect `output/playwright/latest/review-board.png` and individual captures, then run lint and typecheck. Layout or link changes also require `npm run qa:smoke`.

## Project inquiries and Plan Your Home

**Authoritative sources:** [docs/inquiry-flow.md](../inquiry-flow.md) defines the general project inquiry; [docs/plan-your-home-product-spec.md](../plan-your-home-product-spec.md), [docs/plan-your-home-implementation-roadmap.md](../plan-your-home-implementation-roadmap.md), and root [CONTEXT.md](../../CONTEXT.md) define Plan Your Home. [docs/virtual-home-project-brief.md](../virtual-home-project-brief.md) is historical context only.

**Source ownership:** `/start` composes both public choices. General inquiry behavior lives in `app/start/`, the server action and legacy redirect under `app/inquire/`, `components/inquiry/`, `lib/inquiry/`, and `lib/validation/inquiry.ts`. Plan Your Home owns `app/plan-your-home/` and `features/plan-your-home/`; keep the short general inquiry distinct from the detailed Plan Your Home project brief.

**Safeguards:** Treat contact, project details, references, resume capabilities, and consent as private. Preserve noindex policy and the fail-closed owner-review boundary. Never expose tokens, customer data, validator internals, or automated consent/submission authority.

**Verification:** Run the focused affected tests, the full `npm test`, lint, and typecheck. Use `npm run refine:plan-home -- <state>` for Plan Your Home visuals and `npm run proof:plan-home-final:emulator` when the complete journey changes. Inquiry, persistence, or submission changes require `npm run qa:smoke`.

## HHQ, projects, Firebase, and private data

**Authoritative sources:** [docs/architecture.md](../architecture.md), [docs/operations-portal.md](../operations-portal.md), [docs/devops.md](../devops.md), Firestore and Storage rules, and the relevant files under `lib/db/`, `lib/firebase/`, `app/admin/`, and `components/admin/`.

**Source ownership:** Public project queries and publication enforcement live in `lib/db/operations.ts`; HHQ routes and actions live under `app/admin/`; authentication and provider adapters live in `lib/firebase/`. Keep authorization at server boundaries.

**Safeguards:** Only explicitly published projects may reach public HTML, XML, Markdown discovery, or Markdown twins. Keep draft and legacy records private. Never log or publish secrets, private references, session material, customer details, or admin procedures.

**Verification:** Run affected emulator tests plus `npm test`, lint, and typecheck. Project, HHQ, authentication, publication, or Firebase changes require the complete `npm run qa:smoke` workflow.

## Testing, screenshots, deployment, and completion

**Authoritative sources:** [docs/devops.md](../devops.md) defines local review and primary gates; [docs/launch-qa.md](../launch-qa.md) defines launch checks; root [AGENTS.md](../../AGENTS.md) defines Git, issue-delivery, and naming requirements.

**Source ownership:** Unit and rendered tests live in `tests/`; production-boundary acceptance lives in `scripts/qa-smoke.mjs`; route screenshots are produced by `scripts/review.mjs`. Extend existing seams instead of adding duplicate harnesses.

**Safeguards:** Use Node 24. Preserve unrelated work and generated evidence boundaries. Inspect artifacts, commit the exact slice, synchronize branches, and never claim a GitHub issue complete before the implementation lands on the default branch with evidence.

**Verification:** Run focused tests during implementation, `npm run typecheck` regularly, then `npm test`, `npm run lint`, the required `npm run review -- <routes>`, `npm run build`, and `npm run qa:smoke` as applicable. Finish with `git status`, default-branch parity, a concise issue comment, and closure only after landing.
