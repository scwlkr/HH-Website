# Architecture

This document describes the current Howeth and Harp website system as it exists in this repo. It is not a phase plan.

## Product Surfaces

| Surface | Routes | Source |
| --- | --- | --- |
| Marketing site | `/`, `/pricing`, `/pricing/[finishSlug]`, `/catalog`, `/catalog/[buildTypeSlug]`, `/faq`, `/privacy`, `/terms`, `/thank-you` | Local typed content and route components. |
| Project brief | `/inquire` | Server action, Zod validation, rate limiting, and Supabase persistence. |
| Projects | `/projects`, `/projects/[projectSlug]` | Supabase `projects`, `project_images`, and public storage URLs. |
| HHQ | `/admin/login`, `/admin/projects`, `/admin/projects/new`, `/admin/projects/[id]`, `/admin/settings/pricing` | Supabase auth, role check, server actions, and service-role data access. |
| Metadata | `/robots.txt`, `/sitemap.xml`, `/api/og` | App Router metadata helpers and generated route handlers. |

## Stack

| Layer | Implementation |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Runtime | Node 24.x |
| Hosting target | Vercel |
| Database and auth | Supabase |
| Validation | Zod |
| Smoke QA | Playwright through `scripts/qa-smoke.mjs` |

## Repo Structure

```txt
app/          Routes, layouts, server actions, metadata, sitemap, robots, and OG endpoint
components/   Admin, analytics, inquiry, layout, legal, marketing, pricing, projects, and UI primitives
lib/          Content, database access, Supabase auth, validation, analytics, metadata, and formatting helpers
scripts/      Local QA and demo-content utilities
supabase/     SQL migrations for inquiry submissions and HHQ-managed content
types/        Shared TypeScript domain types
public/       Brand assets, placeholders, and image folders
docs/         Active manual path and deprecated historical docs
```

## Rendering Model

The app uses the App Router with server-rendered pages by default. Client components are isolated around interactive surfaces such as the project brief stepper, analytics event triggers, and admin form behavior.

Marketing content for finish levels, build types, FAQ, legal copy, and route metadata lives in typed local modules under `lib/content/` and `lib/metadata.ts`.

## Data Flow

### Project Brief

1. `/inquire` renders the structured project brief.
2. `app/inquire/actions.ts` receives `FormData`.
3. `lib/validation/inquiry.ts` extracts, normalizes, and validates values.
4. The honeypot and in-memory IP rate limiter reject obvious spam.
5. `lib/db/queries.ts` inserts a valid inquiry into `inquiry_submissions`.
6. The user redirects to `/thank-you` after a successful submission.

### Projects And Pricing

1. HHQ server actions in `app/admin/actions.ts` require an authorized admin user.
2. Admin writes go through `lib/db/operations.ts`.
3. Public reads for `/projects`, project detail pages, and pricing settings use cached helpers in `lib/db/operations.ts`.
4. `updateTag(projectCacheTag)` and `updateTag(pricingSettingsCacheTag)` refresh public data after admin saves.
5. If Supabase server credentials are missing, public project reads fall back to empty project data and pricing reads fall back to null pricing values.

### Admin Access

Admin access requires both:

1. a valid Supabase-authenticated session
2. `user.app_metadata.role === "admin"`

The shared rule lives in `lib/supabase/admin-access.ts`. It is used by `lib/supabase/auth.ts`, `lib/supabase/proxy.ts`, and `app/admin/actions.ts`.

## Supabase Shape

| Migration | Tables or resources |
| --- | --- |
| `20260327120000_create_inquiry_submissions.sql` | `inquiry_submissions` with RLS enabled. |
| `20260327153000_create_operations_portal_tables.sql` | `projects`, `project_images`, `pricing_settings`, `project-images` storage bucket, public read policies. |

The app uses the Supabase service-role key only on the server. Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client code or public docs.

## Environment Variables

See [.env.example](../.env.example) and the root [README](../README.md). The active names are:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HH_CONTACT_PHONE_HREF`
- `HH_CONTACT_PHONE_LABEL`
- `HH_CONTACT_EMAIL`
- `INQUIRY_NOTIFICATION_EMAIL`
- `CRON_SECRET`

## Visual System

The public site uses a restrained drafting-board system: black linework, measured spacing, hard-working grids, crisp dividers, and limited green accent color. The repo's current brand source is [BRAND/BRAND.md](../BRAND/BRAND.md).

HHQ is intentionally more utilitarian than the public site. It should stay fast, dense, and operational.

## Known Launch Gaps

- Apply both Supabase migrations in the target project.
- Set preview and production environment variables.
- Replace placeholder gallery assets with final production imagery.
- Confirm final public phone and email details.
- Choose and connect the production analytics destination.
- Owner-approve privacy and terms copy before removing noindex behavior.
