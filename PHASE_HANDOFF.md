# HOWETH & HARP — PHASE HANDOFF

This document tracks build status against `PLAN.md` and serves as the working handoff between implementation phases.

## Overall Status

- Current phase completed: Phase 4
- Next phase: Phase 5
- Build state: design system, typed content modeling, and all Phase 4 marketing routes are implemented; local verification still needs follow-up because `eslint .`, `tsc --noEmit`, and `next build` continue to stall in this environment after starting without diagnostics, even after clearing `.next` and retrying narrower verification commands

## Master Checklist

- [x] Phase 1 — Project Setup
- [x] Phase 2 — Design System + Core Layout
- [x] Phase 3 — Content Models + Seed Content
- [x] Phase 4 — Marketing Pages
- [ ] Phase 5 — Inquiry Funnel
- [ ] Phase 6 — Metadata, Analytics, Accessibility, and Hardening
- [ ] Phase 7 — QA + Launch Readiness

---

## Phase 1 — Project Setup

**Status:** Complete

**Accomplished**

- Scaffolded a Next.js App Router project with TypeScript, Tailwind CSS, ESLint, and npm scripts.
- Removed generated starter template code and placeholder assets.
- Replaced the default shell with a minimal server-rendered foundation page.
- Added baseline global styling and initial design tokens to support the drafting-inspired system in later phases.
- Established the architecture-aligned folder structure for `app`, `components`, `lib`, `public/images`, `styles`, and `types`.
- Added environment variable scaffolding for site metadata and future Supabase integration.
- Verified local development, linting, type checking, and production build.

**Checklist**

- [x] Initialize Next.js App Router project
- [x] Configure TypeScript
- [x] Configure Tailwind CSS
- [x] Set up the base project folder structure from `ARCHITECTURE.md`
- [x] Create environment variable scaffolding
- [x] Add linting setup
- [x] Verify local development and production build both run
- [x] Remove dead starter code

**Left To Do**

- No remaining Phase 1 acceptance items.
- Keep `.env.local` ready for real values before Phase 5 database work.

---

## Phase 2 — Design System + Core Layout

**Status:** Complete with verification follow-up

**Accomplished**

- Replaced the temporary Phase 1 shell with the actual root site layout in `app/layout.tsx`.
- Expanded the token layer and global stylesheet to define colors, spacing, line hierarchy, radii, container widths, and restrained drafting-inspired framing primitives.
- Built the global header and footer with centralized nav, CTA, contact, and legal configuration.
- Built shared layout primitives for containers, page intros, sections, and divider frames.
- Built reusable base UI components for buttons, inputs, textareas, selects, accordions, and card shells.
- Reworked the current home page into a Phase 2 system preview that exercises the shared primitives without jumping into full Phase 4 marketing content.
- Added lightweight route shells for primary nav and legal destinations so shared navigation resolves cleanly before page-specific implementation begins.
- Verified the new shell and placeholder routes respond successfully in a fresh local `next dev` session.

**Checklist**

- [x] Create the root layout shell for the site
- [x] Implement global styles and Tailwind conventions
- [x] Define design tokens for colors, spacing, line weights, borders, radii, and container widths
- [x] Build the global site header
- [x] Build the global site footer
- [x] Build shared layout wrappers and section primitives
- [x] Build reusable base UI components
- [x] Introduce restrained drafting-inspired visual primitives

**Left To Do**

- Investigate why `npm run typecheck` and `npm run build` stall locally after route/runtime verification, even after TypeScript errors were resolved.
- Replace temporary footer contact placeholders once final phone and email destinations are provided.

---

## Phase 3 — Content Models + Seed Content

**Status:** Complete with verification follow-up

**Accomplished**

- Added `types/content.ts` with forward-looking `FinishLevel`, `BuildType`, `FAQItem`, and related slug/image/group types to support Phase 4 page builds without reshaping the model later.
- Added `lib/content/finish-levels.ts` with three seeded finish levels, stable slug helpers, comparison points, best-fit guidance, gallery metadata, and inquiry-prefill path helpers.
- Added `lib/content/build-types.ts` with four seeded build categories, stable slug helpers, hero/gallery metadata, service mix notes, and finish-level cross-links.
- Added `lib/content/faq.ts` with grouped FAQ metadata, ten seeded FAQ items, and helper utilities for grouped rendering and preview slices.
- Added shared content utilities in `lib/content/image-paths.ts`, `lib/content/slug-helpers.ts`, and `lib/content/index.ts` so future routes can resolve slugs and image conventions consistently.
- Established local image folder conventions under `public/images/finishes` and `public/images/build-types`.
- Updated the current route placeholders and home-page preview controls to consume the new content layer rather than keeping those seeded values embedded inline.

**Checklist**

- [x] Define `FinishLevel`, `BuildType`, and `FAQItem` types
- [x] Create typed local content files for finish levels
- [x] Create typed local content files for build types
- [x] Create typed local content files for FAQ content
- [x] Create slug lookup helpers
- [x] Add realistic seed content
- [x] Establish image path conventions

**Left To Do**

- Consume the seeded content layer in the actual Phase 4 marketing pages and dynamic detail routes.
- Replace placeholder image paths with real production assets while keeping the seeded folder conventions intact.
- Resolve the local verification stall affecting `eslint .`, `tsc --noEmit`, and `next build`.

---

## Phase 4 — Marketing Pages

**Status:** Complete with verification follow-up

**Accomplished**

- Replaced the Phase 2 system-preview home page with the actual marketing homepage built around HH capabilities, finish-level previews, build-type previews, FAQ preview, and repeated inquiry routing.
- Replaced the pricing, catalog, FAQ, and thank-you placeholders with real server-rendered marketing pages using the shared Phase 2 layout primitives instead of one-off route markup.
- Implemented the dynamic finish detail route in `app/pricing/[finishSlug]/page.tsx` with static params, per-page metadata, image gallery, included characteristics, best-fit guidance, cross-links, and inquiry-prefill CTA routing.
- Implemented the dynamic build-type detail route in `app/catalog/[buildTypeSlug]/page.tsx` with static params, per-page metadata, category imagery, typical considerations, suggested finish levels, and inquiry-prefill CTA routing.
- Added reusable Phase 4 marketing components for action links, CTA bands, finish/build cards, comparison rendering, and image grids so page structure remains composable rather than route-specific.
- Added structured marketing copy in `lib/content/marketing.ts` so long-form homepage and page intro content is not embedded ad hoc in page JSX.
- Added server-side content image fallback handling plus drafting-inspired SVG placeholders so the seeded galleries render cleanly before final production photography is available.
- Removed internal placeholder messaging from the public footer while keeping the final phone-routing input isolated in site config.

**Checklist**

- [x] Build the home page
- [x] Build pricing overview
- [x] Build finish detail route and pages
- [x] Build catalog overview
- [x] Build build type detail route and pages
- [x] Build FAQ page
- [x] Build thank-you page shell

**Left To Do**

- Complete Phase 5 inquiry implementation so the new inquiry CTAs route into a real guided intake rather than the current placeholder shell.
- Replace the seeded placeholder gallery assets with final finish and category photography while preserving the same folder conventions and route structure.
- Resolve the lingering local verification stall so lint, typecheck, and production build can be completed normally again.

---

## Phase 5 — Inquiry Funnel

**Status:** Not started

**Accomplished**

- Phase 1 added environment scaffolding and route placeholders needed for future inquiry persistence.

**Checklist**

- [ ] Define inquiry TypeScript types
- [ ] Define the Zod validation schema
- [ ] Normalize enum-like inquiry fields
- [ ] Build the inquiry page UX
- [ ] Add progress handling and grouped form structure
- [ ] Support query param prefills for `finish` and `buildType`
- [ ] Set up Supabase connection and server-side persistence
- [ ] Create the `inquiry_submissions` table
- [ ] Implement submission workflow and redirects
- [ ] Add anti-spam protections

**Left To Do**

- Build the inquiry flow as the central structured intake system for the site.
- Keep validation, sanitization, and secrets fully server-side.
- Ensure the user experience feels guided rather than like a generic CRM form.

---

## Phase 6 — Metadata, Analytics, Accessibility, and Hardening

**Status:** Not started

**Accomplished**

- Phase 1 added the initial metadata shell in the root layout and a public site URL environment placeholder.

**Checklist**

- [ ] Add metadata for every page
- [ ] Generate unique metadata for dynamic finish pages
- [ ] Generate unique metadata for dynamic build type pages
- [ ] Create Open Graph image strategy
- [ ] Create a modular tracking utility
- [ ] Track key CTA and inquiry events
- [ ] Complete accessibility pass
- [ ] Complete performance pass
- [ ] Normalize visual consistency across the site

**Left To Do**

- Expand metadata from the base shell to all routes.
- Add analytics without coupling tracking logic to presentation code.
- Verify accessibility, performance, and visual consistency before launch prep.

---

## Phase 7 — QA + Launch Readiness

**Status:** Not started

**Accomplished**

- Phase 1 verified the project can boot locally and produce a successful production build.

**Checklist**

- [ ] Test all routes
- [ ] Test invalid slug behavior
- [ ] Test inquiry prefill parameters
- [ ] Test successful submissions
- [ ] Test failed submissions
- [ ] Test mobile layouts
- [ ] Test tablet and desktop layouts
- [ ] Test header and footer links
- [ ] Test call and email links
- [ ] Verify environment handling in production
- [ ] Deploy to Vercel preview
- [ ] Verify production deployment

**Left To Do**

- Perform end-to-end route, form, and device QA once implementation is complete.
- Validate production behavior on Vercel before considering the site launch-ready.

---

## Immediate Next Action

Proceed with Phase 5:

- define the inquiry schema, shared validation, and enum-like field normalization
- replace the inquiry placeholder route with the guided intake experience
- implement server-side submission handling, anti-spam protection, and redirect to `/thank-you`
