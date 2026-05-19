# Howeth and Harp Website

> Drafting-board public site, project brief funnel, and HHQ operations workspace for Howeth and Harp.

[![Next.js](https://img.shields.io/badge/Next.js-16.2.1-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-149ECA?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-24.x-5FA04E?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)

## Field Notes

This repo powers the Howeth and Harp marketing site, project brief intake flow, completed-home project pages, and internal HHQ admin workspace. The public experience is server-rendered by default and uses a restrained architectural drafting system: crisp linework, measured spacing, simple geometry, and no fake blueprint cosplay.

| Surface | Purpose |
| --- | --- |
| Public site | Explain services, finish levels, build categories, FAQ, and legal pages. |
| Project brief | Collect structured client project details at `/inquire`. |
| Projects | Show completed homes and live `for-sale` / `sold` status from Supabase. |
| HHQ | Protected admin workspace for projects and square-foot pricing. |

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For local smoke QA, install Chromium once:

```bash
npx playwright install chromium
npm run qa:smoke
```

## Commands

| Command | Use |
| --- | --- |
| `npm run dev` | Start the local Next.js dev server. |
| `npm run build` | Create a production build. |
| `npm run start` | Serve a built production app. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm run qa:smoke` | Build and smoke-test the production app with a fake Supabase endpoint. |

## Configuration

Use `.env.example` for names only. Do not commit real values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical site URL for metadata and absolute links. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes for auth/admin | Browser-safe Supabase URL for auth/session handling. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes for auth/admin | Browser-safe Supabase anon key. |
| `SUPABASE_URL` | Yes for writes/admin data | Server-side Supabase URL, with fallback to `NEXT_PUBLIC_SUPABASE_URL`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes for writes/admin data | Server-only key for inquiry writes, public data reads, and HHQ writes. |
| `HH_CONTACT_PHONE_HREF` | Optional | Public `tel:` link. Must include the `tel:` prefix to render. |
| `HH_CONTACT_PHONE_LABEL` | Optional | Human-readable phone label. |
| `HH_CONTACT_EMAIL` | Optional | Public contact email. Defaults to `hello@howethandharp.com`. |
| `INQUIRY_NOTIFICATION_EMAIL` | Optional | Reserved future notification target. |
| `CRON_SECRET` | Optional | Reserved cron authorization secret. |

HHQ access requires a Supabase user whose `app_metadata.role` is `admin`. A valid Supabase session without that role is not enough.

## Documentation Path

Start with [docs/README.md](docs/README.md), then use the focused docs:

- [Architecture](docs/architecture.md)
- [Inquiry flow](docs/inquiry-flow.md)
- [Operations portal](docs/operations-portal.md)
- [Launch QA](docs/launch-qa.md)
- [Glossary](docs/glossary.md)
- [Style guide](docs/style-guide.md)

Historical build-plan artifacts live in [docs/deprecated/](docs/deprecated/).

## Project Shape

```txt
app/          Next.js App Router routes, server actions, metadata, and sitemap
components/   Shared layout, marketing, inquiry, project, admin, and UI components
lib/          Content, Supabase, validation, metadata, analytics, and formatting helpers
scripts/      Local QA and demo-content utilities
supabase/     Database migrations for inquiries, projects, images, and pricing
public/       Brand assets and image placeholders
docs/         Current manual path and deprecated historical docs
```

## Launch State

The core public routes, structured inquiry flow, Supabase-backed projects/pricing path, protected HHQ admin surface, and smoke test script are present. Launch still depends on real environment values, applied Supabase migrations, owner-approved legal content, final contact details, final production imagery, and the selected analytics destination.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Every behavior change should update the relevant doc in [docs/README.md](docs/README.md).

## License

Copyright (c) Howeth and Harp. All rights reserved.
