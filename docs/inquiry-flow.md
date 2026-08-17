# General Project Inquiry

The short general project inquiry is embedded at `/start#general-inquiry` below the primary Plan Your Home path. It gives remodel, multifamily, commercial, land-development, and other projects a simple way to contact h and h without presenting the general inquiry as a detailed project brief. Legacy `/inquire` URLs redirect to this canonical form.

## Runtime Path

| Step | File | Behavior |
| --- | --- | --- |
| Page render | `app/start/page.tsx` | Renders the Plan Your Home hero and the embedded general inquiry, including safe project-type and UTM prefill. |
| Legacy redirect | `app/inquire/page.tsx` | Redirects `/inquire` to the anchored form while preserving allowlisted project type and UTM parameters only. |
| Client UI | `components/inquiry/general-inquiry-form.tsx` | Renders the accessible single-screen form and field feedback. |
| Server action | `app/inquire/actions.ts` | Receives submitted `FormData`. |
| Validation | `lib/validation/inquiry.ts` | Extracts, normalizes, sanitizes, and validates values with Zod. |
| Rate limit | `lib/inquiry/rate-limit.ts` | Applies a basic in-memory IP submission limit. |
| Persistence | `lib/db/queries.ts` | Inserts valid submissions into `inquirySubmissions`. |
| Success | `app/thank-you/page.tsx` | Confirms receipt of the project inquiry. |

## Fields

- Name is required.
- At least one of email or phone is required.
- Project type is required.
- Project location is optional.
- A short `What are you planning?` message is required.

Project types are New single-family home, Remodel or addition, Multifamily or townhomes, Commercial, Land or site development, and Other or not sure.

## Submission Pipeline

1. `/start` reads an optional allowlisted build type and UTM attribution parameters.
2. The user submits the single-screen form.
3. The server action checks the hidden honeypot field and derives an IP rate-limit key.
4. Zod validation returns exact field errors when input is incomplete or malformed.
5. Valid values are mapped to the versioned general-inquiry record.
6. Firebase Admin creates the Firestore document.
7. A successful write redirects to `/thank-you`.

## Failure Behavior

| Failure | User behavior |
| --- | --- |
| Honeypot filled | Redirects to `/thank-you` without writing to Firestore. |
| Rate limit tripped | Shows a retry-later error. |
| Field validation failed | Returns field-specific feedback without losing entered data. |
| Firestore write failed | Shows a server-error state and asks the user to retry or email h and h. |

## Firestore Contract

Each valid submission creates `inquirySubmissions/{id}` through Firebase Admin. Firestore rules deny direct browser access.

The record uses `schemaVersion: 1`, `experience: "general-inquiry"`, and stores name; nullable email and phone values with at least one present; project type; nullable project location; project description; source page; nullable UTM fields; `status: "new"`; and a Firestore `createdAt` timestamp.

## Guardrails

- Keep validation shared in `lib/validation/inquiry.ts` and persistence server-only.
- Keep Firebase Admin credentials server-only. Use local ADC and Vercel OIDC instead of a service-account key.
- Keep the general inquiry short and distinct from the detailed Plan Your Home project brief.
- Add new inquiry fields to types, validation, UI, the Firestore contract, smoke tests, and this doc together.
