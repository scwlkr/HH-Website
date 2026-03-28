# HOWETH & HARP — LAUNCH QA

This checklist supplements `PHASE_HANDOFF.md` for Phase 7.

## Automated Local QA

Run the repeatable smoke suite against the production build:

```bash
npx playwright install chromium
npm run qa:smoke
```

The smoke run covers:

- public route coverage, including invalid finish/build-type slugs
- inquiry prefill query parameters
- header, footer, legal, email, and phone links
- mobile, tablet, and desktop overflow checks
- inquiry validation failure handling
- inquiry server-error handling
- inquiry success redirect and persistence payload shape

The smoke suite uses a local fake Supabase endpoint so the inquiry flow can be verified without touching a real project database.

## Real Environment Checklist

Before preview or production deployment, confirm:

- `NEXT_PUBLIC_SITE_URL` is set to the actual deployment origin
- `SUPABASE_URL` is set to the target Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` is set in preview and production
- `HH_CONTACT_PHONE_HREF` is set to a real `tel:` link
- `HH_CONTACT_PHONE_LABEL` is set to the public-facing display number
- `HH_CONTACT_EMAIL` is set if launch should use an address other than `hello@howethandharp.com`
- the Supabase migration in `supabase/migrations/20260327120000_create_inquiry_submissions.sql` has been applied

## Preview And Production Checks

Once Vercel environments are available, verify:

- preview deploy renders the same routes and metadata as local smoke QA
- inquiry submissions persist to the real Supabase project
- analytics events land in the chosen production destination
- privacy and terms content is owner-approved before removing `noindex`
- the public phone number and email are final
