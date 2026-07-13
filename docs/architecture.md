# Architecture

This document describes the current Howeth and Harp website system as it exists in this repo. It is not a phase plan.

## Product Surfaces

| Surface | Routes | Source |
| --- | --- | --- |
| Marketing site | `/`, `/pricing`, `/pricing/[finishSlug]`, `/catalog`, `/catalog/[buildTypeSlug]`, `/faq`, `/privacy`, `/terms`, `/thank-you` | Local typed content and route components. |
| Project brief | `/inquire` | Server action, Zod validation, rate limiting, and Firestore persistence. |
| Projects | `/projects`, `/projects/[projectSlug]` | Firestore project documents with embedded image metadata and Firebase Storage URLs. |
| HHQ | `/admin/login`, `/admin/projects`, `/admin/projects/new`, `/admin/projects/[id]`, `/admin/settings/pricing` | Firebase Auth, custom-claim role check, server actions, and Firebase Admin access. |
| Metadata | `/robots.txt`, `/sitemap.xml`, `/api/og` | App Router metadata helpers and generated route handlers. |

## Stack

| Layer | Implementation |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Runtime | Node 24.x |
| Hosting target | Vercel |
| Database, auth, and files | Cloud Firestore, Firebase Auth, and Firebase Storage |
| Validation | Zod |
| Smoke QA | Playwright through `scripts/qa-smoke.mjs` |

## Repo Structure

```txt
app/          Routes, layouts, server actions, metadata, sitemap, robots, and OG endpoint
components/   Admin, analytics, inquiry, layout, legal, marketing, pricing, projects, and UI primitives
lib/          Content, database access, Firebase auth, validation, analytics, metadata, and formatting helpers
scripts/      Local QA and demo-content utilities
firebase.json Firebase Emulator Suite and deploy configuration
firestore.*   Firestore rules and indexes
storage.rules Firebase Storage rules
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
5. If Firebase Admin is unavailable, public project reads fall back to empty project data and pricing reads fall back to null pricing values.

### Admin Access

Admin access requires both:

1. a valid Firebase session cookie
2. a verified Firebase custom claim where `role === "admin"`

The shared rule lives in `lib/firebase/admin-access.ts`. It is used by `lib/firebase/auth.ts`, `lib/firebase/proxy.ts`, and `app/admin/actions.ts`.

## Firebase Shape

| Resource | Contract |
| --- | --- |
| `inquirySubmissions/{id}` | Validated project brief, `status`, and Firestore `createdAt` timestamp. |
| `projects/{id}` | Project fields plus the embedded `images` array. |
| `projectSlugs/{slug}` | Stable slug-to-project-ID lookup. |
| `settings/pricing` | Shared square-foot pricing fields and `updatedAt`. |
| Firebase Storage | Image objects at `projects/{projectId}/{file}` with download-token URLs. |

Firestore and Storage rules deny direct client access. Server reads and writes use Firebase Admin. Local development uses Application Default Credentials; Vercel uses OIDC and Workload Identity Federation without a service-account key.

## Environment Variables

See [.env.example](../.env.example) and the root [README](../README.md). The active names are:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `GCP_PROJECT_ID`
- `GCP_PROJECT_NUMBER`
- `GCP_SERVICE_ACCOUNT_EMAIL`
- `GCP_WORKLOAD_IDENTITY_POOL_ID`
- `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID`
- `HH_CONTACT_PHONE_HREF`
- `HH_CONTACT_PHONE_LABEL`
- `HH_CONTACT_EMAIL`
- `INQUIRY_NOTIFICATION_EMAIL`

## Visual System

The public site uses a restrained drafting-board system: black linework, measured spacing, hard-working grids, crisp dividers, and limited green accent color. The repo's current brand source is [BRAND/BRAND.md](../BRAND/BRAND.md).

HHQ is intentionally more utilitarian than the public site. It should stay fast, dense, and operational.

## Known Launch Gaps

- Enable Firebase Auth email/password sign-in, Firestore, and Firebase Storage.
- Upgrade Firebase to Blaze before provisioning Storage.
- Configure Vercel OIDC and Workload Identity Federation.
- Set preview and production environment variables.
- Replace placeholder gallery assets with final production imagery.
- Confirm final public phone and email details.
- Choose and connect the production analytics destination.
- Owner-approve privacy and terms copy before removing noindex behavior.
