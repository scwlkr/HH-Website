# Documentation Style Guide

## Voice

- Write in present tense.
- Prefer concrete file names, route names, commands, and environment variable names.
- Keep public language aligned with [glossary.md](glossary.md).
- Use "Howeth and Harp" first, then "H&H" when a shorter label helps.
- Keep the tone precise and useful. The visual system is drafting-inspired, but docs should not perform the aesthetic.

## Files

- Active docs live in `docs/` with lowercase kebab-case names.
- `README.md` is the repo landing page.
- `docs/README.md` is the manual map.
- Planning, phase, proposal, draft, and historical docs belong in `docs/deprecated/` once they stop being the active contract.
- Do not edit generated output, vendored files, build artifacts, lockfiles, migrations, schemas, or code as part of a docs-only cleanup.

## Links

- Link to the canonical doc instead of repeating long explanations.
- Use relative links for repo docs.
- Repair links immediately after moving or renaming docs.
- Do not guess links to private dashboards, private infrastructure, or secret stores.

## Secrets And Access

- Document environment variable names and purposes only.
- Never include token values, passwords, service-role values, private URLs, client records, or private operational screenshots.
- Keep `.env.example` and docs aligned by variable name.

## Deprecation Notes

Every deprecated doc should begin with:

- original path
- replacement doc
- reason for deprecation

Delete only empty files, accidental files, generated docs, or verbatim duplicates.
