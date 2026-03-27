# HOWETH & HARP — PHASE HANDOFF

This document tracks build status against `PLAN.md` and serves as the working handoff between implementation phases.

## Overall Status

- Current phase completed: Phase 2
- Next phase: Phase 3
- Build state: design system and shared layout are implemented; lint and local route runtime checks passed; `tsc --noEmit` and `next build` still need follow-up because they stall in the current local environment after successful route verification

## Master Checklist

- [x] Phase 1 — Project Setup
- [x] Phase 2 — Design System + Core Layout
- [ ] Phase 3 — Content Models + Seed Content
- [ ] Phase 4 — Marketing Pages
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
- Move into Phase 3 by modeling finish levels, build types, FAQ content, and slug helpers against the new shell.

---

## Phase 3 — Content Models + Seed Content

**Status:** Not started

**Accomplished**

- Phase 1 created the `lib/content` and `types` directories where this content layer will live.

**Checklist**

- [ ] Define `FinishLevel`, `BuildType`, and `FAQItem` types
- [ ] Create typed local content files for finish levels
- [ ] Create typed local content files for build types
- [ ] Create typed local content files for FAQ content
- [ ] Create slug lookup helpers
- [ ] Add realistic seed content
- [ ] Establish image path conventions

**Left To Do**

- Move all long-form marketing content into typed local data files.
- Ensure future dynamic routes can resolve by stable slug.
- Keep page components free of embedded content arrays and hardcoded detail content.

---

## Phase 4 — Marketing Pages

**Status:** Not started

**Accomplished**

- Phase 1 created the required route directories for pricing, catalog, FAQ, inquire, and thank-you pages.

**Checklist**

- [ ] Build the home page
- [ ] Build pricing overview
- [ ] Build finish detail route and pages
- [ ] Build catalog overview
- [ ] Build build type detail route and pages
- [ ] Build FAQ page
- [ ] Build thank-you page shell

**Left To Do**

- Implement all required marketing routes from `ARCHITECTURE.md`.
- Ensure the pages are server-rendered, structured, and clearly route users toward inquiry.
- Reuse the Phase 2 design system and Phase 3 content layer instead of building pages ad hoc.

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

Proceed with Phase 2:

- replace the temporary Phase 1 landing shell with the actual shared site layout
- build header, footer, section wrappers, and UI primitives
- formalize the drafting-inspired visual system into reusable tokens and components
