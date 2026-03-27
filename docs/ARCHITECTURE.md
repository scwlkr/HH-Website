# HOWETH & HARP — WEBSITE ARCHITECTURE

## 1. Purpose

This document defines the full website architecture for **Howeth & Harp (HH)**, an architectural design, building, and land development company. It is written as an implementation spec for Codex or any engineer responsible for building the site.

This is **not** a business strategy document. It is a build blueprint.

The site must communicate professionalism, technical credibility, and design discipline while keeping the user journey simple and strongly oriented toward a project inquiry.

---

## 2. Core Objectives

The website must:

1. Present HH as a serious design/build/development company.
2. Showcase build categories and finish levels clearly.
3. Guide visitors toward a structured inquiry flow.
4. Feel architectural, restrained, and precise.
5. Use a modern, maintainable stack with server-rendered pages.
6. Be easy to extend later without structural rewrites.

---

## 3. Required Stack

## Frontend

* **Next.js** (App Router)
* **TypeScript**
* **Tailwind CSS**
* **Server-rendered by default** using React Server Components where appropriate

## Hosting / Runtime

* **Vercel**

## Data Layer

* **Primary recommendation: Supabase**
* Use Supabase for:

  * Postgres database
  * optional image storage for future CMS/admin use
  * simple server-side form persistence
  * future admin dashboard expansion if needed

### Why Supabase over Vercel Postgres for this project

For this specific site, the main dynamic requirement is storing and managing inquiry submissions cleanly. Supabase gives Postgres plus a mature dashboard and optional storage/auth without forcing a larger custom admin build.

If the implementation team strongly prefers Vercel-native database tooling, Vercel Postgres is acceptable, but the default architecture in this document assumes **Supabase Postgres**.

## Deployment Model

* Deploy on Vercel
* Use environment variables for all secrets
* Production, preview, and local environments must be supported

---

## 4. Rendering Strategy

Use the **Next.js App Router**.

### Default rendering rules

* Prefer **Server Components** for all content-heavy pages
* Use **Client Components only where interactivity is required**
* Use server actions or route handlers for inquiry submission
* Avoid making the whole site client-rendered

### Page behavior

* Marketing/content pages should be server-rendered
* Interactive UI such as multi-step inquiry flow can use isolated client components
* Image galleries can remain server-rendered with light client enhancement only where needed

### Caching strategy

* Static-ish marketing pages can use default caching / revalidation where appropriate
* Inquiry-related actions must always be dynamic and uncached
* Future CMS-driven content should use explicit revalidation rules

---

## 5. Brand / Visual System

The visual language should feel like:

* old-school architectural drafting
* clean technical notebook
* measured, restrained, premium
* strong geometry and line discipline
* not playful, not glossy-tech-startup, not corporate-generic

### Visual references to capture

* drafting board layouts
* architectural line weights
* blueprint logic translated into a white-paper presentation
* hatch fills used sparingly
* orthographic precision
* margin systems that feel like sheet composition

### Core colors

* **Background / paper**: warm sketch-paper white
* **Primary text / linework**: black
* **Accent green**: `#0F4D0F`

### Drafting motifs

Use these carefully and consistently:

* straight ruled lines
* angles inspired by 90, 60, 45, 30 degree drafting behavior
* line-weight hierarchy
* crosshatch / grass-hatch style accents
* border framing
* measured spacing blocks
* sectional dividers that feel like drawing sheet composition

### Important restraint rule

The design must **reference** drafting aesthetics, not cosplay as a blueprint. It should stay clean, readable, modern, and quiet.

Do **not**:

* over-texture the UI
* use fake distressed paper
* make the site look like a novelty notebook
* clutter pages with decorative linework
* reduce readability with overly thin lines or low-contrast text

---

## 6. Design Principles

1. **Precision first** — spacing, alignment, and hierarchy must feel exact.
2. **Restraint first** — minimal ornament, strong composition.
3. **Content drives layout** — no empty visual tricks.
4. **Strong CTA structure** — every major page should guide toward inquiry.
5. **Architectural credibility** — the site should feel designed, not templated.
6. **Fast and calm** — simple transitions, minimal motion.

---

## 7. Information Architecture

The initial site architecture should include these top-level routes:

* `/` — Landing / Home
* `/pricing` — Finish levels overview
* `/pricing/builder-grade`
* `/pricing/builder-plus`
* `/pricing/custom`
* `/catalog` — Build type catalog overview
* `/catalog/single-family`
* `/catalog/multifamily`
* `/catalog/townhomes`
* `/catalog/commercial`
* `/faq`
* `/inquire` — structured inquiry funnel
* `/thank-you` — post-submission success page

### Optional but recommended supporting routes

* `/about` — only if needed later; not required for v1
* `/contact` — lightweight direct-contact page if desired, but **do not** make this the primary conversion route
* `/privacy`
* `/terms`

### Navigation structure

Primary nav should stay lean:

* Home
* Pricing
* Catalog
* FAQ
* Start a Project

Header CTA:

* **Start a Project**

Footer should include:

* phone
* email
* key navigation links
* legal links

---

## 8. User Flow Architecture

### Primary funnel

User lands on site → understands HH → sees build categories / finish levels → starts inquiry → submits project details → reaches thank-you state

### Core conversion paths

#### Path A — Home-led conversion

`/` → `/inquire`

#### Path B — Finish-level led conversion

`/pricing` → finish detail page → `/inquire?finish=...`

#### Path C — Build-type led conversion

`/catalog` → build type detail page → `/inquire?buildType=...`

#### Path D — FAQ reassurance conversion

`/faq` → `/inquire`

### Funnel rule

The site should repeatedly encourage inquiry, but it must not feel like a pushy sales funnel. The experience should feel like a guided project intake.

---

## 9. Page-by-Page Architecture

## 9.1 Home Page (`/`)

### Purpose

* establish brand tone
* explain what HH does
* direct users into the inquiry flow
* provide fast access to pricing and catalog

### Required sections

1. **Hero**

   * strong headline
   * short supporting copy
   * primary CTA: Start a Project
   * secondary CTA: Call or Email
   * architectural linework framing the hero

2. **What HH Does**

   * architectural design
   * building
   * land development
   * presented as concise capability blocks

3. **Finish Levels Preview**

   * three cards: Builder Grade, Builder+, Custom
   * each links to respective pricing/finish page

4. **Build Types Preview**

   * single family
   * multifamily
   * townhomes
   * commercial
   * each links to respective catalog page

5. **Inquiry Preview Block**

   * a simple explanation of how the project inquiry works
   * CTA into `/inquire`

6. **FAQ Preview**

   * 3 to 5 common questions
   * link to full FAQ

7. **Footer CTA**

   * Start a Project
   * Call
   * Email

### Home page tone

This page should be sparse and strong. No bloated marketing sections.

---

## 9.2 Pricing Overview (`/pricing`)

### Purpose

Explain the three finish levels clearly and route the user to detail pages.

### Required sections

1. **Intro**

   * what finish levels represent
   * clarify that exact pricing may depend on scope, site conditions, and project specifics
   * do not make this page legally risky or misleading

2. **Three finish level cards**

   * Builder Grade
   * Builder+
   * Custom

Each card must include:

* title
* short description
* concise differentiator bullets
* CTA: View Finish Details
* CTA should link to the dedicated finish page

3. **Comparison section**

   * side-by-side high-level comparison
   * simple matrix or stacked comparison blocks
   * do not overload with technical fine print

4. **Inquiry CTA block**

   * Start a Project

### Important architecture rule

This page is not the final destination. It is a routing page into deeper finish-specific pages and then into inquiry.

---

## 9.3 Finish Detail Pages (`/pricing/[finishSlug]`)

Pages:

* `/pricing/builder-grade`
* `/pricing/builder-plus`
* `/pricing/custom`

### Purpose

Show imagery and describe the feel / level of each finish package.

### Required structure

1. **Hero / title block**

   * finish level title
   * brief positioning copy

2. **Image gallery**

   * image-forward presentation
   * clean masonry or grid layout
   * server-rendered image data
   * use Next Image

3. **Included characteristics**

   * a structured list of what typifies this finish level
   * not legal contract language
   * not vague fluff

4. **Best fit section**

   * who this finish level is generally suited for

5. **Cross-links**

   * links to the other finish levels

6. **CTA**

   * Start a Project with this finish level preselected

### Slug rules

Use stable slugs:

* `builder-grade`
* `builder-plus`
* `custom`

---

## 9.4 Catalog Overview (`/catalog`)

### Purpose

Show the categories of projects HH handles.

### Required structure

1. **Intro**

   * short explanation of project categories

2. **Build type cards**

   * single family
   * multifamily
   * townhomes
   * commercial

Each card must include:

* title
* short descriptor
* image or line-art support
* CTA to category detail page

3. **CTA band**

   * Start a Project

---

## 9.5 Build Type Detail Pages (`/catalog/[buildTypeSlug]`)

Pages:

* `/catalog/single-family`
* `/catalog/multifamily`
* `/catalog/townhomes`
* `/catalog/commercial`

### Purpose

Explain the category and guide visitors into inquiry.

### Required structure

1. **Hero / title block**
2. **Category imagery or project visuals**
3. **Category description**
4. **Typical project considerations**
5. **Suggested finish levels or relevant links to pricing**
6. **CTA to inquiry with build type preselected**

### Important rule

These pages should feel like disciplined category pages, not blog posts.

---

## 9.6 FAQ (`/faq`)

### Purpose

Reduce hesitation and answer common project questions.

### Structure

* grouped accordion or stacked Q/A layout
* keep questions concise
* end with CTA to inquiry

### Suggested FAQ groupings

* process
* pricing / finish levels
* project types
* timeline expectations
* contact / next steps

### UX rule

FAQ content must remain scannable and not become a giant wall of text.

---

## 9.7 Inquiry Funnel (`/inquire`)

### Purpose

Collect structured lead/project information without feeling like a cold generic contact form.

### Core UX rule

This page must feel like a **guided project brief intake**, not a “submit your info” form.

### Recommended UX format

Use a **multi-step inquiry flow** or a **single page broken into clear progressive sections**.

Preferred v1 implementation:

* visually segmented multi-step flow
* lightweight progress indicator
* minimal friction
* no long unbroken form dump

### Required data to collect

At minimum:

* name
* phone
* email
* approximate square footage
* project type
* finish level of interest
* project location or target area
* timeline / target start window
* budget range or investment range if desired
* short project description

### Strongly recommended fields

* lot status (already owned / looking / not sure)
* whether they need architectural design, build, land development, or combination
* preferred contact method

### Example funnel sections

#### Step 1 — Basic Contact

* name
* phone
* email
* preferred contact method

#### Step 2 — Project Basics

* project type
* approximate square footage
* finish level interest
* services needed

#### Step 3 — Site / Scope Context

* project location
* lot status
* timeline
* optional budget range

#### Step 4 — Project Description

* free-text description
* goals / priorities

#### Step 5 — Review + Submit

* summary
* submit action

### Inquiry UX rules

* plain English labels
* no enterprise-sounding CRM language
* generous spacing
* supportive helper text
* preserve user input between steps
* strong validation messages
* mobile-first usability

### Submission behavior

On submit:

1. validate server-side
2. save to database
3. optionally send notification email to HH
4. redirect to `/thank-you`

### Anti-spam requirements

* honeypot field
* rate limiting
* server-side validation
* optional CAPTCHA only if abuse becomes a problem

---

## 9.8 Thank You Page (`/thank-you`)

### Purpose

Confirm successful submission and tell the user what happens next.

### Required sections

* confirmation message
* simple next-step explanation
* backup contact info
* return to home link

---

## 10. Content Model

Even if v1 content is hardcoded, structure it as if it may later move into a CMS.

## Recommended content entities

### FinishLevel

Fields:

* `id`
* `slug`
* `title`
* `shortDescription`
* `longDescription`
* `highlights[]`
* `galleryImages[]`
* `sortOrder`

### BuildType

Fields:

* `id`
* `slug`
* `title`
* `shortDescription`
* `longDescription`
* `considerations[]`
* `galleryImages[]`
* `relatedFinishSlugs[]`
* `sortOrder`

### FAQItem

Fields:

* `id`
* `question`
* `answer`
* `group`
* `sortOrder`

### InquirySubmission

Fields:

* `id`
* `createdAt`
* `name`
* `phone`
* `email`
* `preferredContactMethod`
* `projectType`
* `finishLevel`
* `servicesNeeded[]`
* `approxSquareFootage`
* `projectLocation`
* `lotStatus`
* `timeline`
* `budgetRange`
* `projectDescription`
* `sourcePage`
* `utmSource`
* `utmMedium`
* `utmCampaign`
* `status`

---

## 11. Data Architecture

## Database recommendation

Use **Supabase Postgres**.

### Initial required tables

* `inquiry_submissions`

### Optional future tables

* `finish_levels`
* `build_types`
* `faq_items`
* `site_settings`

For v1, finish levels, build types, and FAQ may be file-based content in the codebase.

### Recommendation for v1 content storage

Use local typed content files for:

* finish levels
* build types
* faq

Use database only for:

* inquiry submissions

This keeps v1 simple and robust.

---

## 12. Form Submission Architecture

## Preferred implementation

Use a server action or route handler to process inquiry submissions.

### Requirements

* schema validation with Zod
* sanitize text input
* save to database on the server
* return structured success/error states
* never expose secrets client-side

### Validation rules

* name required
* email required and valid
* phone required
* project type required
* square footage numeric or parseable string
* free-text fields length-limited

### Error handling

* field-level messages for validation errors
* generic fallback for server failure
* user must not lose all entered data on validation failure

---

## 13. Suggested Project Structure

Use a Next.js App Router project organized like this:

```txt
app/
  layout.tsx
  page.tsx
  globals.css

  pricing/
    page.tsx
    [finishSlug]/
      page.tsx

  catalog/
    page.tsx
    [buildTypeSlug]/
      page.tsx

  faq/
    page.tsx

  inquire/
    page.tsx
    actions.ts

  thank-you/
    page.tsx

  api/
    inquiry/
      route.ts            # optional if using route handlers instead of server actions

components/
  layout/
    site-header.tsx
    site-footer.tsx
    page-shell.tsx
    section-frame.tsx

  marketing/
    hero.tsx
    finish-card.tsx
    build-type-card.tsx
    faq-preview.tsx
    cta-band.tsx

  pricing/
    finish-comparison.tsx
    finish-gallery.tsx

  catalog/
    build-type-grid.tsx

  inquiry/
    inquiry-form.tsx
    inquiry-stepper.tsx
    inquiry-progress.tsx
    inquiry-review.tsx

  ui/
    button.tsx
    input.tsx
    textarea.tsx
    select.tsx
    radio-group.tsx
    checkbox.tsx
    accordion.tsx
    badge.tsx
    divider.tsx

lib/
  content/
    finish-levels.ts
    build-types.ts
    faq.ts
  db/
    client.ts
    queries.ts
  validation/
    inquiry.ts
  utils/
    cn.ts
    metadata.ts
    tracking.ts

public/
  images/
    finishes/
    build-types/
    brand/
    og/

styles/
  tokens.css

types/
  content.ts
  inquiry.ts
```

### Architectural rule

Keep content, validation, UI, and persistence clearly separated.

---

## 14. Component System Rules

### UI direction

Components should be custom and restrained. Do not make the site feel like a generic SaaS dashboard.

### Required reusable primitives

* button
* text input
* textarea
* select
* radio / segmented control
* accordion
* section wrapper
* image card
* CTA band
* page intro block

### Styling rules

* establish a clear type scale
* establish line-weight tokens
* establish spacing scale
* establish radius rules
* establish border rules

### Drafting-specific component ideas

* `SectionFrame` with measured border treatment
* `LineWeightDivider`
* `CornerBracket` accents
* `HatchPanel` used sparingly for emphasis blocks

### Important warning

Drafting flourishes must be implemented as deliberate reusable primitives, not random one-off decorations.

---

## 15. Typography and Layout System

### Typography

Use a refined, legible system.

Recommended structure:

* one main sans or serif/sans pairing
* body text must remain highly readable
* headings should feel technical and composed
* avoid trendy editorial excess

### Layout

* strong max-width container system
* consistent vertical rhythm
* generous whitespace
* grid-based card layouts
* image grids with disciplined ratios

### Rhythm

Every section should look intentionally sheet-composed, not auto-stacked.

---

## 16. Motion Rules

Motion should be minimal.

Allowed:

* subtle hover states
* soft accordion transitions
* small step transitions in inquiry flow
* gentle image fade-ins if needed

Avoid:

* flashy parallax
* dramatic reveal animations
* heavy scroll-trigger effects
* anything that makes the site feel trendy instead of disciplined

---

## 17. SEO / Metadata Architecture

Every page must define metadata.

### Requirements

* title
* description
* Open Graph image
* canonical handling
* clean route naming

### Content principles

* each finish page should have unique metadata
* each build type page should have unique metadata
* FAQ should be crawlable, not hidden behind client-only rendering

---

## 18. Accessibility Requirements

The site must be accessible by default.

### Requirements

* semantic heading order
* keyboard accessible navigation
* visible focus states
* labeled form controls
* sufficient contrast
* accessible accordions
* error messages associated with fields
* screen-reader clarity for progress state in inquiry flow

### Important rule

Do not sacrifice accessibility for aesthetic thinness.

---

## 19. Responsive Behavior

Design mobile-first.

### Mobile priorities

* fast access to Start a Project CTA
* sticky or persistent contact action only if tasteful
* inquiry flow must be comfortable on small screens
* galleries must collapse elegantly

### Tablet/Desktop

* stronger use of grid layouts
* more visible drafting frame treatments
* expanded whitespace and image composition

---

## 20. Performance Requirements

### Must-haves

* optimized images via Next Image
* keep client JavaScript small
* use Server Components by default
* avoid heavy animation libraries unless absolutely necessary
* lazy-load non-critical media

### Performance philosophy

This is a high-trust architectural brand site. It should feel crisp and lightweight.

---

## 21. Analytics / Tracking Readiness

The architecture should allow lightweight tracking without polluting the build.

### Trackable events

* start project CTA clicks
* call clicks
* email clicks
* finish detail page CTA clicks
* build type CTA clicks
* inquiry submission success

### Rule

Tracking must be modular and not tightly coupled to rendering logic.

---

## 22. Security / Reliability Requirements

### Requirements

* all secrets in environment variables
* no client exposure of sensitive credentials
* validate all incoming form data server-side
* sanitize user-entered text
* rate-limit inquiry endpoint or action
* protect against spam

### Reliability rule

Inquiry submission is the most important dynamic workflow on the site. It must be engineered carefully.

---

## 23. Content Population Strategy

For v1, populate the site with structured seed content in typed local files.

### Populate first

* finish levels
* build types
* FAQ
* hero and home-page copy blocks

### Keep hardcoded only where acceptable

* brand constants
* nav items
* footer contact info

### Do not hardcode in components

* long descriptive page content
* FAQ arrays inline in page files
* finish/build-type definitions inside JSX

---

## 24. Implementation Decisions Codex Must Follow

1. Use **Next.js App Router**, not Pages Router.
2. Use **TypeScript everywhere**.
3. Use **Server Components by default**.
4. Use **Tailwind CSS** for styling.
5. Use **Supabase Postgres** for inquiry persistence.
6. Keep v1 content file-based except inquiry submissions.
7. Build the inquiry flow as a guided, elegant intake experience.
8. Keep routing stable and semantic.
9. Build reusable drafting-inspired UI primitives.
10. Prioritize clarity, precision, and extendability over cleverness.

---

## 25. Open Decisions That Should Be Treated as Inputs, Not Architectural Unknowns

These are content inputs that the implementation can scaffold around:

* final brand wordmark/logo assets
* final photography/image sets for finish levels
* final written copy for finish details
* final FAQ copy
* final phone/email destination
* final inquiry notification destination

These are **not** reasons to delay the architecture.

---

## 26. Explicit Non-Goals for v1

Do **not** build these into v1 unless explicitly requested later:

* full CMS
* user login area
* client dashboard
* online quoting engine
* complex animated experience
* map-heavy GIS interface
* blog/news system
* headless commerce

---

## 27. Recommended Build Sequence

1. set up Next.js app with Tailwind and TypeScript
2. establish global layout, tokens, and core UI primitives
3. implement content models and typed local content files
4. build home page
5. build pricing overview and finish detail pages
6. build catalog overview and build type detail pages
7. build FAQ page
8. build inquiry flow UX
9. implement server-side inquiry persistence
10. add metadata, analytics hooks, accessibility polish, and final QA

---

## 28. Definition of Done

The website is considered architecturally complete when:

* all required routes exist
* all content pages are structured and render correctly
* finish levels and build types are modeled cleanly
* inquiry flow works end-to-end
* submissions are validated and saved server-side
* the visual system consistently reflects HH’s drafting-inspired identity
* the site is responsive, accessible, and production-ready

---

## 29. Final Instruction to Codex

Build this site as a **clean, server-rendered, drafting-inspired architectural brand website** with a structured inquiry funnel at its center.

Do not improvise the architecture into a generic startup site.
Do not overcomplicate the stack.
Do not bury the inquiry path.
Do not break the visual discipline with random decorative choices.

Preserve clarity, discipline, hierarchy, and extensibility in every implementation decision.
