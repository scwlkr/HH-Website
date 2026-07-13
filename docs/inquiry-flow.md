# Inquiry Flow

The project brief at `/inquire` is the primary conversion flow. It collects structured scope, contact, site, timing, budget, service, and source data before writing an inquiry submission to Firestore.

## Runtime Path

| Step | File | Behavior |
| --- | --- | --- |
| Page render | `app/inquire/page.tsx` | Renders the project brief and query-param prefill state. |
| Client UI | `components/inquiry/` | Handles stepper, review state, progress display, and field feedback. |
| Server action | `app/inquire/actions.ts` | Receives the submitted `FormData`. |
| Validation | `lib/validation/inquiry.ts` | Extracts, normalizes, sanitizes, and validates values with Zod. |
| Rate limit | `lib/inquiry/rate-limit.ts` | Applies a basic in-memory IP submission limit. |
| Persistence | `lib/db/queries.ts` | Inserts valid submissions into `inquirySubmissions`. |
| Success | `app/thank-you/page.tsx` | Confirms submission and provides direct-contact fallback. |

## Submission Pipeline

1. The page reads optional `finish`, `buildType`, and UTM query parameters.
2. The user completes the guided project brief.
3. The server action checks the hidden honeypot field.
4. The action derives a rate-limit key from request headers.
5. Zod validation returns exact field errors when input is incomplete or malformed.
6. Valid values are mapped to the database insert shape.
7. Firebase Admin creates the Firestore document.
8. A successful write redirects to `/thank-you`.

## Failure Behavior

| Failure | User behavior |
| --- | --- |
| Honeypot filled | Redirects to `/thank-you` without writing to Firestore. |
| Rate limit tripped | Shows a retry-later error. |
| Field validation failed | Returns field-specific feedback without losing entered data. |
| Firestore write failed | Shows a server-error state and asks the user to retry or email H&H. |

## Firestore Contract

Each valid submission creates `inquirySubmissions/{id}` through Firebase Admin. Firestore rules deny direct browser access.

The stored fields include contact details, preferred contact method, project type, finish level, requested services, square footage, location, lot status, timeline, optional budget range, project description, source page, UTM fields, `status: "new"`, and a Firestore `createdAt` timestamp.

## Guardrails

- Keep validation shared in `lib/validation/inquiry.ts`.
- Keep persistence server-only.
- Keep Firebase Admin credentials server-only. Use local ADC and Vercel OIDC instead of a service-account key.
- Keep the project brief structured; do not collapse it into a generic contact form.
- Add new inquiry fields to types, validation, UI, the Firestore contract, smoke tests, and this doc together.
