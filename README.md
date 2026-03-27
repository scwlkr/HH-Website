# Howeth & Harp Website

Next.js App Router marketing site for Howeth & Harp, aligned to the architecture and phased implementation plan in `ARCHITECTURE.md` and `PLAN.md`.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- ESLint

## Scripts

- `npm run dev` starts local development
- `npm run build` creates the production build
- `npm run start` runs the production server
- `npm run lint` runs ESLint
- `npm run typecheck` runs TypeScript without emitting files
- `npm run qa:smoke` builds the app and runs the Phase 7 smoke suite against a local production server

## Environment

Copy `.env.example` to `.env.local` before adding local values.

## Current Status

Phase 7 is in progress:

- drafting-inspired shared layout and reusable UI primitives are in place
- typed content models back the finish levels, build types, FAQ, and shared marketing copy
- home, pricing, catalog, FAQ, thank-you, legal pages, and both dynamic detail route sets are implemented
- inquiry persistence, validation, analytics hooks, and success handling are implemented
- `npm run lint`, `npm run typecheck`, and `npm run build` now complete successfully locally
- the Phase 7 smoke suite verifies routes, inquiry prefills, submission failure/success paths, and responsive overflow checks against the production build

## Launch Notes

- Set `NEXT_PUBLIC_SITE_URL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` before preview or production deploys.
- Set `HH_CONTACT_PHONE_HREF` and `HH_CONTACT_PHONE_LABEL` before launch if the site should expose a public call link.
- Run `npx playwright install chromium` once before the first `npm run qa:smoke`.
- See `docs/LAUNCH_QA.md` for the deployment-facing checklist.

## Project Structure

```txt
app/
  api/inquiry/
  catalog/[buildTypeSlug]/
  faq/
  inquire/
  pricing/[finishSlug]/
  thank-you/
components/
  catalog/
  inquiry/
  layout/
  marketing/
  pricing/
  ui/
lib/
  content/
  db/
  utils/
  validation/
public/images/
styles/
types/
```
