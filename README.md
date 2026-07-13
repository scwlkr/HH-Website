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
| Projects | Show completed homes and live `for-sale` / `sold` status from Firestore. |
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
| `npm run qa:smoke` | Build and smoke-test the production app against local Firebase emulators. |

## Configuration

Use `.env.example` for names only. Do not commit real values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical site URL for metadata and absolute links. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes for HHQ | Browser-safe Firebase web API key. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes for HHQ | Firebase Auth domain. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Firebase Storage bucket name. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes for HHQ | Firebase web app sender ID. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes for HHQ | Firebase web app ID. |
| `FIREBASE_PROJECT_ID` | Yes for server access | Server-side Firebase project ID. |
| `FIREBASE_STORAGE_BUCKET` | Yes for project images | Server-side Firebase Storage bucket name. |
| `GCP_PROJECT_ID`, `GCP_PROJECT_NUMBER` | Yes on Vercel | Google Cloud project identity for OIDC. |
| `GCP_SERVICE_ACCOUNT_EMAIL` | Yes on Vercel | Keyless service account impersonated through OIDC. |
| `GCP_WORKLOAD_IDENTITY_POOL_ID`, `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID` | Yes on Vercel | Workload Identity Federation pool and provider. |
| `HH_CONTACT_PHONE_HREF` | Optional | Public `tel:` link. Must include the `tel:` prefix to render. |
| `HH_CONTACT_PHONE_LABEL` | Optional | Human-readable phone label. |
| `HH_CONTACT_EMAIL` | Optional | Public contact email. Defaults to `hello@howethandharp.com`. |
| `INQUIRY_NOTIFICATION_EMAIL` | Optional | Reserved future notification target. |

HHQ access requires a Firebase Auth user with the custom claim `role: "admin"`. A valid Firebase session without that claim is not enough.

Local server access uses Google Application Default Credentials. Run `gcloud auth application-default login`; do not create or upload a service-account key. Production on Vercel uses Workload Identity Federation and Vercel OIDC.

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
lib/          Content, Firebase, validation, metadata, analytics, and formatting helpers
scripts/      Local QA and demo-content utilities
firebase.json Firebase Emulator Suite and deploy configuration
firestore.*   Firestore rules and indexes
storage.rules Firebase Storage rules
public/       Brand assets and image placeholders
docs/         Current manual path and deprecated historical docs
```

## Launch State

The core public routes, structured inquiry flow, Firebase-backed projects/pricing path, protected HHQ admin surface, and smoke test script are present. Launch still depends on production environment values, Firebase Auth and Storage readiness, owner-approved legal content, final contact details, final production imagery, and the selected analytics destination.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Every behavior change should update the relevant doc in [docs/README.md](docs/README.md).

## License

Copyright (c) Howeth and Harp. All rights reserved.
