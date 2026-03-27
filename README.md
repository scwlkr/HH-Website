# Howeth & Harp Website

Phase 1 foundation for the Howeth & Harp marketing website described in `ARCHITECTURE.md` and `PLAN.md`.

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

## Environment

Copy `.env.example` to `.env.local` before adding local values.

## Current Status

Phase 1 is complete:

- project scaffolded with App Router, TypeScript, and Tailwind
- root folder structure aligned to the architecture document
- starter template code and assets removed
- environment scaffolding added for future Supabase and metadata work

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
