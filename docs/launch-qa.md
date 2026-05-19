# Launch QA

Use this checklist before preview or production launch.

## Local Automated QA

Run:

```bash
npx playwright install chromium
npm run qa:smoke
```

The smoke suite builds the app, starts a local production server, and checks:

- public route coverage
- invalid finish and build-type slugs
- project brief query-param prefill
- header, footer, legal, email, and phone links
- mobile, tablet, and desktop overflow behavior
- project brief validation failure handling
- project brief server-error handling
- success redirect and persistence payload shape

The script uses a fake Supabase endpoint for inquiry testing, so local smoke QA does not write to a real project database.

## Environment Checklist

Set real values in preview and production:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HH_CONTACT_PHONE_HREF`
- `HH_CONTACT_PHONE_LABEL`
- `HH_CONTACT_EMAIL`

Optional:

- `INQUIRY_NOTIFICATION_EMAIL`
- `CRON_SECRET`

Keep secret values out of docs, issues, screenshots, and chat.

## Supabase Checklist

- Apply `supabase/migrations/20260327120000_create_inquiry_submissions.sql`.
- Apply `supabase/migrations/20260327153000_create_operations_portal_tables.sql`.
- Confirm the `project-images` bucket exists and is public for reads.
- Confirm public read policies exist for projects, project images, pricing settings, and project image objects.
- Create the intended admin user.
- Set that user's `app_metadata.role` to `admin`.
- Confirm public signup behavior matches the owner-approved access model.

## Preview Checks

- Preview deploy renders every public route.
- `/admin/login` loads when Supabase public auth env is present.
- Non-admin users cannot access protected HHQ routes.
- Admin users can create and edit a project.
- Saved projects appear at `/projects` and `/projects/[projectSlug]`.
- Pricing settings appear on public pricing surfaces.
- Inquiry submissions persist to Supabase.
- Analytics events reach the selected destination if one is connected.

## Production Hold Points

Do not treat the site as launch-ready until:

- final phone and email values are confirmed
- owner-approved legal content is in place
- privacy and terms noindex behavior is intentionally resolved
- final production imagery replaces placeholders where required
- Supabase migrations and environment values are confirmed in production
