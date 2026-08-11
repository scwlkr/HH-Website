# Architecture

This document describes the current Howeth and Harp website system as it exists in this repo. It is not a phase plan.

## Product Surfaces

| Surface | Routes | Source |
| --- | --- | --- |
| Marketing site | `/`, `/pricing`, `/pricing/[finishSlug]`, `/catalog`, `/catalog/[buildTypeSlug]`, `/faq`, `/privacy`, `/terms`, `/thank-you` | Local typed content and route components. |
| Project start | `/start` | Routes detached single-family new homes to Plan Your Home and preserves `/inquire` for every other project type. |
| Project briefs | `/inquire`, `/plan-your-home`, `/plan-your-home/resume` | Generic server action plus the versioned Plan Home registry, reducer, server actions, local snapshot, and secure resume flow. |
| Projects | `/projects`, `/projects/[projectSlug]` | Firestore project documents with embedded image metadata and Firebase Storage URLs. |
| HHQ | `/admin`, `/admin/login`, `/admin/inquiries`, `/admin/inquiries/[id]`, `/admin/inquiries/file`, `/admin/projects`, `/admin/projects/new`, `/admin/projects/[id]`, `/admin/settings/pricing` | Firebase Auth, custom-claim role check, inquiry queue/detail/status/file actions, project actions, and Firebase Admin access. |
| Plan Home handlers | `POST /plan-your-home/resume/consume`, `GET /api/plan-your-home/resume-mail/latest`, `GET|POST /api/internal/plan-your-home/cleanup` | One-time resume-token exchange, emulator-only fake-mailbox drain, and bearer-authorized retention cleanup. |
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
features/     Versioned Plan Your Home domain, scenes, state, validation, persistence contracts, and HHQ inquiry models
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

### Generic Project Brief

1. `/inquire` renders the structured project brief.
2. `app/inquire/actions.ts` receives `FormData`.
3. `lib/validation/inquiry.ts` extracts, normalizes, and validates values.
4. The honeypot and in-memory IP rate limiter reject obvious spam.
5. `lib/db/queries.ts` inserts a valid inquiry into `inquirySubmissions`.
6. The user redirects to `/thank-you` after a successful submission.

### Plan Your Home

1. `/start` sends detached single-family new homes to `/plan-your-home` and all
   other work to the preserved generic `/inquire` brief.
2. The browser runs the fixed `plan-home-v1` registry and pure tour reducer. A
   30-day local snapshot retains the exact active prompt for same-browser
   refresh; the server remains authoritative once a draft exists.
3. The question-6 contact gate validates contact and answer data, creates an
   `inquirySubmissions` draft, and sets an HTTP-only, same-site draft-session
   cookie. Transactional, revision-checked checkpoints save completed zone
   boundaries, while final submission validates all answers, references, and
   consent before changing the same record from `draft` to `submitted` once.
4. `/plan-your-home/resume` returns the same response whether an address has a
   resumable draft or not. Rate-limited requests rotate a hashed, 15-minute,
   one-use token; the token arrives in the URL fragment and is posted to the
   consume route, which retires it and issues a new draft session. The fake
   mailbox endpoint is available only outside production with the Firestore
   emulator; production uses the configured Resend transport.
5. Reference server actions validate the draft session, revision, type, size,
   count, and HTTPS-link contract before issuing a short-lived upload ticket.
   Production receives a V4 signed `PUT` for one reserved Storage generation;
   only a loopback Storage emulator with a `demo-` bucket receives the multipart
   emulator endpoint. The capability binds the exact ticket path and generation;
   finalization verifies the size, content type, custom metadata, and file
   signature before adding private reference metadata to the draft.
6. HHQ lists legacy and Plan Home records together. `/admin/inquiries/[id]`
   shows the complete answer/reference detail, supports reviewed/spam status
   actions and deletion, and issues short-lived signed reads through the
   authenticated `/admin/inquiries/file` handler.
7. The bearer-authorized internal cleanup route removes expired Plan Home
   drafts, resume tokens, upload tickets, and verified orphaned reference
   objects. Provider scheduling and production retention policy remain launch
   gates.

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
| `inquirySubmissions/{id}` | Legacy generic submissions plus versioned Plan Home drafts/submissions with contact, stable answer map, progress, references, derived queue fields, revisions, timestamps, and retention metadata. |
| `inquirySubmissions/{draftId}/referenceUploads/{referenceId}` | Short-lived, generation-bound upload tickets used only while a private Plan Home file is pending finalization. |
| `planHomeResumeTokens/{tokenHash}` | Hashed one-time resume-token lifecycle records; raw tokens are not stored. |
| `planHomeResumeRateLimits/{keyHash}` | Hashed email/requester rate-limit windows for resume requests. |
| `projects/{id}` | Project fields plus the embedded `images` array. |
| `projectSlugs/{slug}` | Stable slug-to-project-ID lookup. |
| `settings/pricing` | Shared square-foot pricing fields and `updatedAt`. |
| Firebase Storage | Public project images at `projects/{projectId}/{file}` and private Plan Home files at `inquiryReferences/{draftId}/{uuid}` without download tokens. |

Firestore and Storage rules deny direct client access. Server reads and writes
use Firebase Admin. Plan Home draft mutations additionally require the matching
hashed session capability, resume tokens are stored only by hash, upload
finalization verifies object identity and content, and HHQ operations require the
shared admin claim. Local development uses Application Default Credentials;
Vercel uses OIDC and Workload Identity Federation without a service-account key.

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
- `PLAN_HOME_DRAFT_SESSION_SECRET`
- `PLAN_HOME_RESUME_SECRET`
- `PLAN_HOME_PUBLIC_ORIGIN`
- `PLAN_HOME_RESUME_MAIL_TRANSPORT`
- `PLAN_HOME_RESUME_EMAIL_FROM`
- `RESEND_API_KEY`
- `PLAN_HOME_CLEANUP_SECRET`
- `GCP_PROJECT_ID`
- `GCP_PROJECT_NUMBER`
- `GCP_SERVICE_ACCOUNT_EMAIL`
- `GCP_WORKLOAD_IDENTITY_POOL_ID`
- `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID`
- `HH_CONTACT_PHONE_HREF`
- `HH_CONTACT_PHONE_LABEL`
- `HH_CONTACT_EMAIL`
- `INQUIRY_NOTIFICATION_EMAIL`
- `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST`
- `FIREBASE_AUTH_EMULATOR_HOST`
- `FIRESTORE_EMULATOR_HOST`
- `FIREBASE_STORAGE_EMULATOR_HOST`
- `STORAGE_EMULATOR_HOST`

## Visual System

The public site uses a restrained drafting-board system: black linework, measured spacing, hard-working grids, crisp dividers, and limited green accent color. The repo's current brand source is [BRAND/BRAND.md](../BRAND/BRAND.md).

HHQ is intentionally more utilitarian than the public site. It should stay fast, dense, and operational.

## Known Launch Gaps

- Replace placeholder gallery assets with final production imagery.
- Confirm final public phone and email details.
- Choose and connect the production analytics destination.
- Configure the approved production resume-email transport and sending domain.
- Approve the Plan Home retention policy and configure its external cleanup
  scheduler.
- Owner-approve privacy and terms copy before removing noindex behavior.
