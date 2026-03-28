# Contributing to Howeth & Harp

Thank you for your interest in contributing to the **Howeth & Harp** codebase. This project maintains a strict architectural vision, and every technical decision should trace back to the principles established in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

As a contributor, you are an architect of both the code and the documentation. This guide outlines the minimal standards for pull requests, bug fixes, and feature additions.

## The "Docs-First" Standard

At Howeth & Harp, bad documentation is a product bug—we treat it as such. A feature is incomplete until its documentation is written.

### 1. Code Examples Must Run

Any code snippet added to a README or an inline documentation block must be verified before the PR is merged. We do not tolerate "pseudocode" that breaks when copied and pasted.

### 2. No Assumption of Context

Every document must either stand alone or explicitly link to the prerequisite context. We write for clarity and empathy. Use the second person ("you"), present tense, and active voice.

### 3. Version Everything

If your change deprecates an old pattern, update the related documentation or include a migration guide. Do not silently delete content if it alters the user experience.

### 4. One Concept per Section

Do not blend installation, configuration, and conceptual explanations into a wall of text. Structure is non-negotiable.

## Branching Strategy

Our branches should tell a clear story of intent.

- **`main`**: The canonical production state. Protected branch; no direct commits.
- **`feat/[ticket]-descriptive-name`**: For substantive additions to the UI, data layer, or APIs.
- **`fix/[ticket]-descriptive-name`**: For addressing identified bugs or regressions.
- **`docs/[ticket]-descriptive-name`**: Exclusively for documentation updates.

## Pull Request Lifecycle

Before submitting a PR, verify the following:

1. **Linting and Types passed**: Ensure `npm run lint` and `npm run typecheck` run clearly on your branch.
2. **Smoke Test Passed**: Run `npm run qa:smoke` and confirm Playwright tests successfully validate core routes and the inquiry flow.
3. **Drafting Aesthetic Checked**: Does the proposed component align with the drafting board aesthetic in the Architecture doc? Have you verified it avoids glossy textures and overly rounded corners?

## Filing Bugs & Opening Issues

When reporting an issue, use this checklist:

1. **What you're trying to do**: The intended user goal.
2. **What actually happened**: Include error messages, network payloads, or specific misbehavior.
3. **What you expected to happen**: The correct operational state.
4. **Environment**: Did this happen locally or in preview? What branch?

## The 5-Second Test

Every PR covering a new component or major file should pass the 5-second test: if another dev looks at your code and documentation, do they immediately know what it is, why it matters, and how to start using it?

If not, revise it before creating a Pull Request.
