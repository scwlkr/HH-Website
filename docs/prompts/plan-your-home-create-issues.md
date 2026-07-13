# Prompt: Create The Plan Your Home Implementation Issues

Paste the block below into a new Codex task from the repository root after these planning docs are on `main`.

```text
Create the complete GitHub implementation backlog for the h and h "Plan Your Home" tour. This is a planning/GitHub task only: do not implement product code, change production configuration, deploy, or begin issue 1.

Repository: scwlkr/HH-Website

Read completely before acting:
- AGENTS.md
- docs/devops.md
- docs/plan-your-home-product-spec.md
- docs/plan-your-home-implementation-roadmap.md

Treat those files as the product contract. Inspect the live GitHub repository, labels, milestones, open and closed issues, and default branch before creating anything. Do not assume the repo is still empty. Reuse an exact existing issue rather than creating a duplicate.

Create or reuse one open milestone named:
Plan Your Home Tour

Create or reuse these labels with short descriptions:
- plan-your-home — Plan Your Home product work
- next-step — the one issue currently eligible for implementation
- phase:foundation
- phase:data
- phase:experience
- phase:admin
- phase:integration
- phase:quality

Use the existing enhancement label on every implementation issue. Create exactly the 18 ordered issues in the roadmap's Phase Map, using the exact titles and order. Each issue body must be self-contained and include:

1. Outcome
2. Scope
3. Non-goals
4. Dependencies, using links to the actual earlier GitHub issues after they exist
5. Done bar as GitHub task-list checkboxes
6. Proof as GitHub task-list checkboxes
7. Contract links to the product spec and roadmap on the default branch

Copy the corresponding issue contract faithfully from docs/plan-your-home-implementation-roadmap.md. Do not weaken, combine, reinterpret, or add speculative scope. Include the issue-specific proof commands. Also include these worker guardrails in every issue:

- Read AGENTS.md and docs/devops.md before changes.
- Preserve unrelated local changes; never reset, discard, overwrite, or casually stash user work.
- Work only on this issue's scope.
- Use branch codex/issue-<issue-number>-<short-slug> unless the manager provides an already-isolated branch.
- Do not use a git worktree unless the $Using-Git-Worktrees skill is available and explicitly used.
- Inspect changed-route screenshots before claiming UI completion.
- Do not deploy, change DNS, or perform a public cutover.

Label assignment by issue order:
- 1–3: plan-your-home, enhancement, phase:foundation
- 4: plan-your-home, enhancement, phase:data
- 5–11: plan-your-home, enhancement, phase:experience
- 12–14: plan-your-home, enhancement, phase:experience, phase:data
- 15–16: plan-your-home, enhancement, phase:admin
- 17: plan-your-home, enhancement, phase:integration
- 18: plan-your-home, enhancement, phase:quality

Assign every issue to the Plan Your Home Tour milestone. Do not assign a person unless the repository already has an explicit assignee convention for implementation issues.

After all issue numbers are known, repair every dependency section so it links to the actual repository issues. Apply next-step only to the first open issue in sequence. While work remains, exactly one open issue may have next-step.

Use body files or API payload files for issue creation; do not build large issue bodies through fragile shell interpolation. If creation is interrupted, re-audit by exact title and continue idempotently.

Verify before finishing:
- exactly 18 milestone issues exist with the exact ordered titles
- no duplicate exact-title issue exists
- all dependencies point to real issues
- all issues have enhancement, plan-your-home, the correct phase labels, and the milestone
- exactly one open issue has next-step, and it is order 1
- no product code changed

Return a compact numbered list of issue links, the milestone link, the single next-step issue, and any real blocker. Do not start implementation.
```
