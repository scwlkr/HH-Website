# Operations Portal

HHQ is the internal operations workspace for managed website content. It controls completed-home project records, image metadata, project status, and square-foot pricing values used by the public site.

## Admin Routes

| Route | Purpose |
| --- | --- |
| `/admin/login` | Supabase email/password login for HHQ. |
| `/admin/projects` | Project list and management entry point. |
| `/admin/projects/new` | Create a completed-home record. |
| `/admin/projects/[id]` | Edit an existing project. |
| `/admin/settings/pricing` | Edit shared square-foot pricing settings. |

## Authorization Rule

HHQ requires both:

1. a valid Supabase-authenticated session
2. `user.app_metadata.role === "admin"`

The shared authorization helper is `lib/supabase/admin-access.ts`. Do not duplicate a separate admin rule in route files, server actions, or components.

To grant access, set the user's Supabase `app_metadata.role` value to `admin`. Use `app_metadata`, not `user_metadata`.

To remove access, remove that role or change it to another value. The user may need to sign out and back in after role changes.

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
| `/projects` | Supabase `projects` plus cover image data. |
| `/projects/[projectSlug]` | Supabase project detail and gallery data. |
| Pricing surfaces | Supabase `pricing_settings`. |

Public data helpers live in `lib/db/operations.ts`. They use cache tags so admin saves can refresh project and pricing reads.

## Storage

Project image files use the `project-images` Supabase storage bucket. Public URLs are built from the configured Supabase URL, the bucket name, and stored image paths.

## Guardrails

- Keep HHQ functional and dense. It is an internal tool, not a marketing page.
- Keep admin writes in server actions.
- Keep authorization centralized in `lib/supabase/admin-access.ts`.
- Do not allow "logged in" alone to mean "admin".
- Do not store admin authority in form data, query params, or client-controlled metadata.
- Do not expose service-role values in UI, docs, or client bundles.
