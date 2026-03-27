# HOWETH & HARP — IMPLEMENTATION PLAN

## 1. Purpose

This document translates `ARCHITECTURE.md` into a concrete implementation sequence for Codex.

It defines:

* build order
* technical milestones
* dependencies between tasks
* acceptance criteria per phase
* guardrails to prevent architectural drift

This is a delivery plan, not a brainstorming document.

---

## 2. Core Build Strategy

The site should be built in layers, from foundation to pages to inquiry workflow to production hardening.

### Guiding principle

Build the site in this order:

1. foundation
2. design system
3. content modeling
4. page implementation
5. inquiry system
6. polish and production readiness

### Critical rule

Codex must not jump straight into page polish or decorative styling before the core structure, routing, and inquiry flow are sound.

---

## 3. Project Outcome

At the end of this plan, the site must be:

* deployed on Vercel
* built with Next.js App Router + TypeScript + Tailwind
* server-rendered by default
* visually aligned with the HH drafting-inspired brand system
* structurally complete across all required pages
* able to accept, validate, and store inquiry submissions
* production-ready for v1 launch

---

## 4. Phase Overview

### Phase 1 — Project Setup

Establish the project foundation, stack, configuration, and folder structure.

### Phase 2 — Design System + Core Layout

Build the shared layout, global styling, and reusable UI primitives.

### Phase 3 — Content Models + Seed Content

Define the typed content architecture for finish levels, build types, and FAQ content.

### Phase 4 — Marketing Pages

Implement the home page, pricing pages, catalog pages, and FAQ page.

### Phase 5 — Inquiry Funnel

Build the guided inquiry intake experience and persistence workflow.

### Phase 6 — Metadata, Analytics, Accessibility, and Hardening

Add production polish and non-functional requirements.

### Phase 7 — QA + Launch Readiness

Perform final checks, fix defects, and prepare for deployment.

---

## 5. Phase 1 — Project Setup

## Objective

Create the application foundation with the required stack and a clean architecture.

## Tasks

1. Initialize a Next.js project using the App Router.
2. Configure TypeScript.
3. Configure Tailwind CSS.
4. Set up the base project folder structure from `ARCHITECTURE.md`.
5. Create environment variable scaffolding.
6. Add linting and formatting setup if desired.
7. Verify local development and production build both run.

## Required deliverables

* working Next.js app
* App Router enabled
* Tailwind functioning
* base directories created
* no dead starter code left over

## Acceptance criteria

* app runs locally without errors
* `npm run build` or equivalent succeeds
* directory structure is aligned with architecture
* no logic is embedded in random starter files

## Guardrails

* do not use the Pages Router
* do not make the whole app client-side
* do not start writing page-specific logic before structure exists

---

## 6. Phase 2 — Design System + Core Layout

## Objective

Build the shared visual and structural foundation of the site.

## Tasks

1. Create the root layout.
2. Implement global styles and Tailwind conventions.
3. Define design tokens such as:

   * colors
   * spacing
   * line weights
   * border behavior
   * radii
   * container widths
4. Build global site header.
5. Build global site footer.
6. Build shared layout wrappers and section primitives.
7. Build reusable base UI components:

   * button
   * input
   * textarea
   * select
   * accordion
   * basic card shell
   * divider / section frame
8. Introduce drafting-inspired visual primitives in a restrained systemized way.

## Required deliverables

* `app/layout.tsx`
* global header/footer
* reusable section/layout shell
* base UI component library
* brand-consistent visual direction established

## Acceptance criteria

* every page can inherit a consistent shell
* primary CTA styling is defined once and reusable
* linework / border / framing style is coherent
* drafting aesthetics enhance the site without cluttering it

## Guardrails

* do not over-design decorative motifs
* do not scatter one-off border styles throughout the app
* all drafting details must come from reusable primitives or tokens

---

## 7. Phase 3 — Content Models + Seed Content

## Objective

Create the typed content layer so the site is data-driven even before a CMS exists.

## Tasks

1. Define TypeScript types for:

   * FinishLevel
   * BuildType
   * FAQItem
2. Create typed local content files for:

   * finish levels
   * build types
   * faq
3. Create helper utilities for querying content by slug.
4. Add placeholder but realistic seed content where final copy is not yet available.
5. Add image path conventions for galleries and category visuals.

## Required deliverables

* `types/content.ts`
* `lib/content/finish-levels.ts`
* `lib/content/build-types.ts`
* `lib/content/faq.ts`
* slug lookup helpers

## Acceptance criteria

* all content pages can render from structured data
* no large content arrays are embedded directly inside page JSX
* slug-based routing can resolve detail pages cleanly

## Guardrails

* do not fetch content from the database for v1 marketing pages
* do not mix content definitions directly into component files
* keep the content layer simple and typed

---

## 8. Phase 4 — Marketing Pages

## Objective

Implement the full informational site structure before inquiry persistence.

### Build order inside this phase

1. home page
2. pricing overview
3. finish detail pages
4. catalog overview
5. build type detail pages
6. FAQ page
7. thank-you page shell

---

## 8.1 Home Page

## Tasks

1. Build hero section.
2. Build HH capabilities section.
3. Build finish level preview section.
4. Build build type preview section.
5. Build inquiry preview section.
6. Build FAQ preview section.
7. Add repeated CTA structure.

## Acceptance criteria

* clear primary CTA to start a project
* secondary direct contact options exist
* home page feels sparse, strong, and architectural
* major site paths are visible from the home page

---

## 8.2 Pricing Overview

## Tasks

1. Build page intro.
2. Render three finish cards.
3. Create comparison section.
4. Add CTA into inquiry flow.

## Acceptance criteria

* user can understand the three finish levels quickly
* each finish level links to its own detail page
* page is not overloaded with legalistic or unclear pricing copy

---

## 8.3 Finish Detail Pages

## Tasks

1. Implement dynamic route for finish slugs.
2. Resolve content by slug.
3. Add hero/title block.
4. Add image gallery.
5. Add included characteristics section.
6. Add best-fit section.
7. Add cross-links to other finish levels.
8. Add CTA to inquiry with finish preselected.

## Acceptance criteria

* each finish page has unique content and metadata
* gallery presentation is clean and performant
* invalid slugs fail gracefully

---

## 8.4 Catalog Overview

## Tasks

1. Build page intro.
2. Render build type cards.
3. Link each card to its detail page.
4. Add inquiry CTA band.

## Acceptance criteria

* all major project categories are visible
* cards feel consistent with the pricing section but not duplicated blindly

---

## 8.5 Build Type Detail Pages

## Tasks

1. Implement dynamic route for build type slugs.
2. Resolve content by slug.
3. Add hero/title block.
4. Add category visuals.
5. Add category description.
6. Add typical project considerations section.
7. Add relevant links to finish levels.
8. Add CTA to inquiry with build type preselected.

## Acceptance criteria

* category pages are structured, scannable, and disciplined
* users can move naturally from category to inquiry

---

## 8.6 FAQ Page

## Tasks

1. Build page intro.
2. Render FAQ groups.
3. Implement accessible accordion or stacked format.
4. Add end-of-page CTA.

## Acceptance criteria

* content is easy to scan
* accordion is keyboard accessible
* FAQ reduces friction rather than creating visual bulk

---

## 8.7 Thank You Page Shell

## Tasks

1. Build a static thank-you page layout.
2. Include confirmation copy.
3. Include next-step explanation.
4. Include direct phone/email fallback.

## Acceptance criteria

* success destination exists before form integration begins

---

## 9. Phase 5 — Inquiry Funnel

## Objective

Build the project inquiry flow as the central conversion system of the site.

## Order of operations

1. define data schema
2. build UI flow
3. implement validation
4. implement server-side persistence
5. implement submission success/failure handling

---

## 9.1 Inquiry Data Schema

## Tasks

1. Define the inquiry TypeScript type.
2. Define a Zod validation schema.
3. Normalize enum-like fields for:

   * project type
   * finish level
   * lot status
   * preferred contact method
   * services needed
4. Decide how optional budget / timeline values are represented.

## Acceptance criteria

* client and server share the same validation rules where appropriate
* all required fields from architecture are represented

---

## 9.2 Inquiry UI

## Tasks

1. Build the inquiry page shell.
2. Build either:

   * segmented multi-step form, or
   * progressive grouped single-page form
3. Add a progress indicator.
4. Add helper text and gentle UX language.
5. Preserve field state between steps.
6. Support prefilled query params such as:

   * `finish`
   * `buildType`

## Acceptance criteria

* inquiry does not feel like a generic CRM form
* mobile experience is comfortable
* fields are logically grouped
* validation feedback is clear

## Guardrails

* do not create a giant unstructured form dump
* do not use enterprise wording like “lead capture” or “pipeline intake” in user-facing copy

---

## 9.3 Database + Persistence

## Tasks

1. Set up Supabase project and connection environment variables.
2. Create the `inquiry_submissions` table.
3. Implement server-side database write logic.
4. Ensure secrets remain server-side.
5. Add timestamp and submission status defaults.

## Suggested initial table fields

* id
* created_at
* name
* phone
* email
* preferred_contact_method
* project_type
* finish_level
* services_needed
* approx_square_footage
* project_location
* lot_status
* timeline
* budget_range
* project_description
* source_page
* utm_source
* utm_medium
* utm_campaign
* status

## Acceptance criteria

* successful submissions are stored reliably
* failures are handled gracefully
* no direct client-side database credentials are exposed

---

## 9.4 Submission Workflow

## Tasks

1. Implement server action or route handler.
2. Validate request server-side.
3. Reject invalid requests with structured errors.
4. Save valid submissions.
5. Redirect to `/thank-you` on success.
6. Optionally trigger email notification.

## Acceptance criteria

* happy path works end-to-end
* user does not lose data unnecessarily on validation errors
* server errors return safe generic messaging

---

## 9.5 Anti-Spam and Safety

## Tasks

1. Add honeypot field.
2. Add basic rate limiting.
3. Add server-side validation and sanitization.
4. Leave CAPTCHA optional unless needed.

## Acceptance criteria

* spam resistance exists in v1
* normal users are not burdened unnecessarily

---

## 10. Phase 6 — Metadata, Analytics, Accessibility, and Hardening

## Objective

Make the site production-ready beyond visual completion.

---

## 10.1 Metadata

## Tasks

1. Add metadata for every page.
2. Generate unique metadata for dynamic finish pages.
3. Generate unique metadata for dynamic build type pages.
4. Add Open Graph image strategy.

## Acceptance criteria

* no page is missing title/description metadata
* dynamic routes have meaningful metadata

---

## 10.2 Analytics Readiness

## Tasks

1. Create a small tracking utility.
2. Track key CTA clicks.
3. Track inquiry start and successful submission.
4. Keep tracking code modular.

## Acceptance criteria

* events can be added without polluting component logic

---

## 10.3 Accessibility Pass

## Tasks

1. verify semantic heading order
2. verify keyboard navigation
3. verify focus states
4. verify form labeling
5. verify accordion accessibility
6. verify screen-reader clarity in inquiry progress UI
7. verify color contrast

## Acceptance criteria

* no major accessibility failures remain in core flows

---

## 10.4 Performance Pass

## Tasks

1. verify image optimization
2. verify minimal client JS usage
3. remove unnecessary client components
4. lazy-load non-critical media
5. verify reasonable Lighthouse-style performance characteristics

## Acceptance criteria

* site remains lightweight and crisp
* design flourishes do not introduce performance bloat

---

## 10.5 Visual Consistency Pass

## Tasks

1. normalize spacing between pages
2. normalize heading behavior
3. normalize card structures
4. normalize CTA patterns
5. ensure drafting accents are consistent

## Acceptance criteria

* the site feels like one coherent system, not a series of separately built pages

---

## 11. Phase 7 — QA + Launch Readiness

## Objective

Finalize the build and prepare for deployment.

## Tasks

1. test all routes
2. test 404 behavior for invalid slugs
3. test inquiry prefill params
4. test successful submissions
5. test failed submissions
6. test mobile layouts
7. test tablet and desktop layouts
8. test header/footer links
9. test call/email links
10. verify environment variable handling in production
11. deploy to Vercel preview
12. verify production deployment

## Acceptance criteria

* all required pages render correctly
* all CTAs lead somewhere intentional
* inquiry flow works in production
* no placeholder logic remains in critical paths

---

## 12. Suggested Implementation Checklist

Codex should work through this exact checklist:

### Foundation

* [ ] Initialize Next.js App Router project
* [ ] Configure TypeScript and Tailwind
* [ ] Establish folder structure
* [ ] Set up environment variable scaffolding

### Design System

* [ ] Build global layout
* [ ] Build header/footer
* [ ] Define visual tokens
* [ ] Build reusable UI primitives
* [ ] Build drafting-inspired framing primitives

### Content Layer

* [ ] Define content types
* [ ] Create finish-level content file
* [ ] Create build-type content file
* [ ] Create FAQ content file
* [ ] Create slug helpers

### Pages

* [ ] Build home page
* [ ] Build pricing overview
* [ ] Build finish detail route
* [ ] Build catalog overview
* [ ] Build build-type detail route
* [ ] Build FAQ page
* [ ] Build thank-you page

### Inquiry System

* [ ] Define inquiry types and Zod schema
* [ ] Build inquiry page UX
* [ ] Support prefilled query params
* [ ] Create Supabase connection
* [ ] Create inquiry table
* [ ] Implement server-side submission
* [ ] Add success/failure states
* [ ] Add anti-spam protection

### Production Readiness

* [ ] Add metadata
* [ ] Add tracking hooks
* [ ] Complete accessibility pass
* [ ] Complete performance pass
* [ ] QA all routes and forms
* [ ] Deploy to Vercel

---

## 13. Explicit Build Constraints

Codex must follow these constraints:

1. Do not convert the app into a client-rendered SPA.
2. Do not introduce a CMS in v1.
3. Do not overcomplicate the inquiry flow.
4. Do not use generic startup aesthetics.
5. Do not bury content inside JSX when it belongs in typed content files.
6. Do not create decorative drafting motifs as random per-page hacks.
7. Do not build features outside the scope of `ARCHITECTURE.md`.
8. Do not add animation-heavy libraries unless truly necessary.
9. Do not make pricing language misleading or overly specific if actual pricing inputs are not finalized.
10. Do not treat the inquiry flow like a plain contact page.

---

## 14. Recommended Immediate Next Action for Codex

Codex should begin by scaffolding the full project structure, global layout, design tokens, and typed content model before attempting page completion.

That means the first implementation block should be:

1. app shell
2. core layout
3. content types
4. content seed files
5. reusable section and CTA components

Only after that should Codex move into individual page builds.

---

## 15. Definition of Completion

This plan is complete when Codex has produced a working site that:

* matches the architecture
* preserves visual discipline
* includes all required pages
* guides users clearly into inquiry
* stores inquiries reliably
* is launch-ready on Vercel

---

## 16. Final Instruction to Codex

Implement this website as a structured architectural system.

Respect order of operations.
Respect the drafting-inspired design language.
Respect the inquiry funnel as the central functional workflow.
Do not improvise beyond the architecture unless required for technical correctness.
