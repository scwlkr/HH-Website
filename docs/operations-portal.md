# Operations Portal

HHQ is the internal operations workspace for managed website content. It controls completed-home project records, image metadata, project status, and square-foot pricing values used by the public site.

## Admin Routes

| Route | Purpose |
| --- | --- |
| `/admin/login` | Staff sign-in entry point (AuthKit when enabled). |
| `/admin/inquiries` | Review saved and submitted customer inquiries. |
| `/admin/inquiries/[id]` | Review one inquiry, update its status, or permanently delete it. |
| `/admin/inquiries/file` | Issue a short-lived authorized read for one saved private file. |
| `/admin/projects` | Project list and management entry point. |
| `/admin/projects/new` | Create a completed-home record. |
| `/admin/projects/[id]` | Edit an existing project. |
| `/admin/settings/pricing` | Edit shared square-foot pricing settings. |

## Authorization Rule

The server boundary is `lib/admin/auth.ts`. With `HHQ_AUTH_PROVIDER=workos`,
`lib/admin/workos-access.ts` requires a verified individual identity, the configured
H and H organization, an active organization membership with the `hhq-staff`
role, and the same active, unexpired WorkOS session. Membership and session
status are queried on each protected request, so removal and revocation do not
wait for an old access token to expire. Provider failures deny access.

All approved staff have equal access. Owner administration in the WorkOS
workspace is separate. Public signup is disabled; Google and emailed one-time
codes are the chosen sign-in methods. A verified email or an invitation alone
does not confer HHQ access. No customer accounts or new audit-log product are
introduced. Firebase still stores the existing records and files.

The session has an absolute five-day limit. The sealed session cookie is
HttpOnly, SameSite=Lax, Secure in production, and limited to `/admin`. Protected
pages, mutations, private-file actions, and data operations authorize on the
server; proxy redirects are only a navigation guard. Login uses the SDK's PKCE
flow and scoped verifier cookie. Tokens and secrets never enter client code.

Until production setup and live owner verification are complete, an omitted
provider or `HHQ_AUTH_PROVIDER=firebase` retains the existing Firebase shared
login and verified `role: "admin"` claim. A configured WorkOS failure never falls
back to Firebase. Unknown nonempty provider values also fail closed.

## Staffing Change Procedure

In WorkOS, select **H and H → Production**:

1. Create a user with the staff member's exact approved email, then add that
   user to the H and H organization with **HHQ staff** (`hhq-staff`). They can
   sign in through Google or an email code; no shared password is needed.
2. To remove access, deactivate/remove their organization membership or remove
   the HHQ staff role, then revoke their sessions. Leave the default `member`
   role unprivileged. Do not grant a whole email domain automatic staff access.
3. Open HHQ on an old signed-in device and verify that protected pages and file
   reads are denied. Verify the retained owner's account still works.

Initially only the owner's selected WorkOS-account email is approved. Do not
commit staff email lists or production credentials to the repository. Setup,
cutover, domain changes, and rollback are in [the AuthKit runbook](hhq-authkit.md).

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

Private inquiry files remain under `inquiryReferences/{inquiryId}/{object}`.
HHQ accepts a file action only after server authorization, resolves the saved
reference by ID, validates its exact object identity and generation, and then
issues a five-minute signed read. The object path and signed URL are never
rendered into the inquiry page.

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
- Keep authorization centralized in `lib/admin/auth.ts` and `lib/admin/workos-access.ts`.
- Do not allow "logged in" alone to mean "admin".
- Do not store admin authority in form data, query params, or client-controlled metadata.
- Do not expose service-account credentials in UI, docs, or client bundles. Use ADC locally and Vercel OIDC in production.
- Keep individual Google/email-code sign-in, the five-day trusted-device
  session, and equal staff access under ADR 0004.
- Inquiry deletion is permanent. Its confirmation must identify the inquiry,
  resume material, and private files and state that none can be recovered.
- Do not add backups, exports, trash, soft deletion, undo, restore controls, or
  a new audit-log product. The accepted deletion consequence is no recovery;
  historical actions through the shared account cannot identify an individual.
- Reopen the architecture decision if staff or customer count grows
  materially, contractors need access, regulation changes, or private-data
  value and sensitivity increase.
