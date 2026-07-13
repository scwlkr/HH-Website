# Operations Portal

HHQ is the internal operations workspace for managed website content. It controls completed-home project records, image metadata, project status, and square-foot pricing values used by the public site.

## Admin Routes

| Route | Purpose |
| --- | --- |
| `/admin/login` | Firebase email/password login for HHQ. |
| `/admin/projects` | Project list and management entry point. |
| `/admin/projects/new` | Create a completed-home record. |
| `/admin/projects/[id]` | Edit an existing project. |
| `/admin/settings/pricing` | Edit shared square-foot pricing settings. |

## Authorization Rule

HHQ requires both:

1. a valid Firebase session cookie
2. a verified Firebase custom claim where `role === "admin"`

The shared authorization helper is `lib/firebase/admin-access.ts`. Do not duplicate a separate admin rule in route files, server actions, or components.

To grant access, set the Firebase Auth user's custom claim to `{ "role": "admin" }` with trusted admin tooling. Never accept role data from the browser.

To remove access immediately, remove or change the role and revoke that user's refresh tokens (or disable the user). Session-cookie verification checks revocation. A claim change alone may not take effect until the existing session expires or the user signs in again.

## Managed Data

### Projects

Projects are completed-home records displayed on public project routes.

Stored fields include:

- slug
- title
- status
- build type slug
- finish level slug
- square footage
- bedrooms
- bathrooms
- location
- short description
- full description
- featured flag
- cover image
- gallery images

The stored status values are `for-sale` and `sold`.

### Pricing Settings

HHQ manages one shared pricing settings row with:

- Builder Grade price per square foot
- Builder+ price per square foot
- Custom price per square foot
- pricing note
- update timestamp

Public pricing surfaces should read from the shared settings instead of duplicating hardcoded square-foot values.

## Public Site Integration

| Public route | Managed source |
| --- | --- |
| `/projects` | Firestore `projects` explicitly marked `published: true`. |
| `/projects/[projectSlug]` | Firestore `projectSlugs` lookup plus an explicitly published project document. |
| Pricing surfaces | Firestore `settings/pricing`. |

Public data helpers live in `lib/db/operations.ts`. They use cache tags so admin saves can refresh project and pricing reads.

## Storage

Project image files use Firebase Storage at `projects/{projectId}/{file}`. Each Firestore project document embeds image IDs, paths, alt text, sort order, cover status, and download-token URLs.

Firebase Storage provisioning requires the Blaze plan. Direct Firebase SDK reads and writes stay disabled; Firebase Admin owns writes and issues download-token URLs for public image display.

Each HHQ save accepts up to 4 MB of new images combined so the request remains below Vercel's Function payload limit.

## Demo Seed

The demo utility uses the same embedded-image contract as HHQ, but it is
emulator-only. Start the Firestore and Storage emulators, then run the utility
in another terminal:

```bash
FIREBASE_PROJECT_ID=howeth-and-harp-demo \
FIREBASE_STORAGE_BUCKET=howeth-and-harp-demo.firebasestorage.app \
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199 \
node scripts/seed-demo-content.mjs
```

The utility replaces its two known demo projects and their Storage objects as
unpublished drafts. It refuses all Firebase writes unless both emulator host
variables are set. Placeholder image files may still be generated locally.

## Guardrails

- Keep HHQ functional and dense. It is an internal tool, not a marketing page.
- Keep admin writes in server actions.
- Keep authorization centralized in `lib/firebase/admin-access.ts`.
- Do not allow "logged in" alone to mean "admin".
- Do not store admin authority in form data, query params, or client-controlled metadata.
- Do not expose service-account credentials in UI, docs, or client bundles. Use ADC locally and Vercel OIDC in production.
