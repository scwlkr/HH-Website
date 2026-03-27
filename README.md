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

## Environment

Copy `.env.example` to `.env.local` before adding local values.

## Current Status

Phase 4 is implemented:

- drafting-inspired shared layout and reusable UI primitives are in place
- typed content models back the finish levels, build types, FAQ, and shared marketing copy
- home, pricing, catalog, FAQ, thank-you, and both dynamic detail route sets are implemented
- inquiry persistence, validation, and success handling remain Phase 5 work
- broad local verification commands still stall in this environment after starting without diagnostics

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
