# Contributing to Howeth and Harp

This project keeps code and docs in lockstep. If a change alters routes, data flow, environment variables, admin behavior, content ownership, or launch steps, update the matching doc before calling the work complete.

## Working Rules

1. Read [docs/README.md](docs/README.md) before changing behavior.
2. Keep architectural decisions aligned with [docs/architecture.md](docs/architecture.md).
3. Use the language in [docs/glossary.md](docs/glossary.md).
4. Keep docs style consistent with [docs/style-guide.md](docs/style-guide.md).
5. Do not expose secrets, token values, private client details, or private operational URLs.

## Branches

| Branch pattern | Use |
| --- | --- |
| `docs/[topic]` | Documentation-only changes. |
| `feat/[topic]` | New behavior, pages, data surfaces, or workflows. |
| `fix/[topic]` | Bug fixes and regressions. |

`main` is the canonical production branch.

## Pull Request Checklist

Before opening a PR:

- Run `npm run lint`.
- Run `npm run typecheck`.
- Run `npm run qa:smoke` when the change touches routes, forms, admin surfaces, metadata, links, or layout behavior.
- Update the relevant docs in `docs/`.
- Confirm public copy uses "Howeth and Harp" or "H&H", not disallowed variants.
- Confirm any new environment variable appears in `.env.example` and docs by name only.

## Documentation Standard

Good docs are part of the product. Keep them concrete, present-tense, and source-grounded. If a plan or handoff document stops describing current behavior, move it to `docs/deprecated/` and link to the current replacement instead of leaving it in the active reader path.
