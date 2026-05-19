# Documentation

This is the canonical manual path for the Howeth and Harp website repo. Start here instead of reading every markdown file at once.

## Reader Path

| Need | Read |
| --- | --- |
| Understand the current system | [Architecture](architecture.md) |
| Work on the project brief flow | [Inquiry flow](inquiry-flow.md) |
| Work on HHQ or managed public data | [Operations portal](operations-portal.md) |
| Prepare preview or production | [Launch QA](launch-qa.md) |
| Choose project language | [Glossary](glossary.md) |
| Edit docs safely | [Style guide](style-guide.md) |

## Supporting Docs

- [Root README](../README.md) is the GitHub landing page and quick start.
- [Contributing](../CONTRIBUTING.md) is the contributor checklist.
- [Brand guide](../BRAND/BRAND.md) is the naming and visual source for public brand language.

## Deprecated Docs

Historical build-plan artifacts are kept in [deprecated](deprecated/) for traceability:

- [Implementation plan](deprecated/implementation-plan.md)
- [Phase handoff](deprecated/phase-handoff.md)

The previous `docs/old-docs/` copies were byte-for-byte duplicates and are intentionally removed from the tracked manual path.

## Excluded Local Notes

`docs/ignored-docs/` is ignored by Git and treated as local scratch context. Durable guidance from that folder must be merged into the active docs before it counts as project documentation.

## Maintenance Rule

One active doc should own each topic. When a new note repeats an existing explanation, merge the useful facts into the canonical doc and replace the note with a link or deprecate it.
