# Howeth & Harp Website

> The fully server-rendered, architecturally-inspired marketing site and project inquiry portal for Howeth & Harp.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.1-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## Why This Exists

This repository houses the primary web presence for **Howeth & Harp**, an architectural design, building, and land development company. More than just a brochure, this application serves as the authoritative entry point for client project intake. It is designed to reflect an architectural drafting aesthetic—calm, restrained, and precise—while securely and dependably routing structured leads into the company's Supabase backend without relying on heavy client-side JavaScript.

## Quick Start

Get the project running locally in under 60 seconds.

```bash
# 1. Clone & install
npm install

# 2. Set up environment variables
cp .env.example .env.local

# 3. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the site.

## Installation

**Prerequisites**: Node.js 20+, npm 9+ 

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Setup Playwright (For QA Smoke Tests):**
   ```bash
   npx playwright install chromium
   ```

## Configuration

The application requires various environment variables for production functionality. Configure these in your `.env.local` file:

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | `string` | Yes | The canonical URL of the deployment (e.g., `https://howethandharp.com`) |
| `SUPABASE_URL` | `string` | Yes | Supabase Project URL for the database connection |
| `SUPABASE_SERVICE_ROLE_KEY` | `string` | Yes | Supabase Service Role Key for server-side inserts |
| `HH_CONTACT_PHONE_HREF` | `string` | No | `tel:` link for the public call CTA |
| `HH_CONTACT_PHONE_LABEL` | `string` | No | Formatted phone number display string |
| `HH_CONTACT_EMAIL_ADDRESS`| `string` | No | Public-facing email address |

> [!CAUTION]
> Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. It must only be used in secure Server Actions or Route Handlers.

## Usage

### Local Development Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Starts the Next.js local development server with Turbopack |
| `npm run build` | Creates the production-optimized build |
| `npm run start` | Runs the production server (requires a prior build) |
| `npm run lint` | Runs the ESLint suite |
| `npm run typecheck` | Runs the TypeScript compiler without emitting files |
| `npm run qa:smoke` | Builds the app and runs Playwright smoke tests against the local production server |

### Project Structure Overview

```txt
app/
  ├── api/             # Route handlers (if needed)
  ├── catalog/         # Build type routing and dynamic project details
  ├── faq/             # Frequently asked questions
  ├── inquire/         # The critical multi-step project inquiry flow and server actions
  ├── pricing/         # Finish-level descriptions and details
  └── thank-you/       # Post-submission confirmation route
components/
  ├── catalog/         # Reusable catalog UI primitives
  ├── inquiry/         # Form components and validation wrappers
  ├── layout/          # Global navigation, footers, and page shells
  └── ui/              # Shared low-level primitives (buttons, inputs)
lib/
  ├── db/              # Supabase queries and connection layers
  └── validation/      # Zod schemas for form data
```

## Advanced Usage

### Launch & Deployment Checklist

When preparing for a production launch on Vercel, ensure the following steps are handled:

1. **Environment Setup**: Vercel environment variables must mirror your `.env.local` mapping for `NEXT_PUBLIC_SITE_URL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
2. **Contact Links**: Configure `HH_CONTACT_PHONE_HREF`, `HH_CONTACT_PHONE_LABEL`, and `HH_CONTACT_EMAIL_ADDRESS` if public contact options should be exposed.
3. **Database Migrations**: Ensure the Supabase instance has the `inquiry_submissions` table provisioned according to the schema expected by `lib/db/queries`.

For an exhaustive checklist, refer to the internal `docs/LAUNCH_QA.md`.

## System Architecture

For a deep dive into the technical decisions, branding guidelines, and precise routing schemas, please read the [Architecture Document](docs/ARCHITECTURE.md).

If you need to understand how site content is managed via the internal dashboard, review the [Operations Portal Document](docs/OPERATIONS_PORTAL.md).

## Contributing

Please review [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming conventions, documentation standards, and pull request guidelines. All code changes require updated documentation.

## License

Copyright © Howeth & Harp. All rights reserved.
