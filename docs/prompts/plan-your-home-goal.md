# Prompt: Plan Your Home Goal Manager

Paste the block below into `/goal` after the implementation issues exist.

```text
/goal Build the complete h and h "Plan Your Home" tour by executing the GitHub milestone one issue at a time until it is ready for my local browser review.

You are the Goal Manager. Remain in orchestration and review mode for the entire goal. Never write product code in the manager context. Delegate one bounded implementation issue to a coding worker, review its work and proof, merge it to main, close it, then advance to the next issue. Continue automatically until the milestone is genuinely complete; do not stop merely because one issue finished.

Repository: scwlkr/HH-Website
Milestone: Plan Your Home Tour

Read completely before routing work:
- AGENTS.md
- docs/devops.md
- docs/plan-your-home-product-spec.md
- docs/plan-your-home-implementation-roadmap.md

Source of truth:
- Live GitHub issue state and comments are the execution record.
- The repository docs are the product contract.
- Re-read the selected issue and its latest comments immediately before delegating or judging it.
- Do not rely on a stale task summary when live GitHub or the working tree can answer.

Queue invariant:
- While the milestone has unfinished work, exactly one open issue has next-step.
- The next-step issue must be the earliest unfinished issue whose dependencies are closed.
- Only that issue may be implemented.
- At milestone completion, zero issues have next-step.
- Verify the label query and the selected issue directly; filtered GitHub output can be misleading.

Manager loop:
1. Inspect branch, status, remote, milestone, issue list, labels, dependency state, and current next-step issue.
2. If the invariant is wrong, repair labels without changing the planned sequence.
3. Create one coding-worker task for the selected issue. Give it the exact issue URL, acceptance contract, relevant repo docs, branch name codex/issue-<number>-<slug>, and required proof. One worker owns one issue only.
4. The worker must inspect existing code before editing, preserve unrelated user changes, make the smallest in-scope change, commit frequently, run the issue's checks, inspect UI screenshots, and report commit hashes plus proof.
5. Do not use git worktrees unless the $Using-Git-Worktrees skill is available and explicitly invoked. Do not reset, discard, overwrite, or casually stash user work. If unrelated dirty files prevent safe isolation, work around them with exact-path staging; report a blocker only when safe isolation is truly impossible.
6. Review the actual diff and commits against the issue. Independently inspect test output, route behavior, emulator state where relevant, and every changed-route screenshot. For UI work, use the repo's browser/review workflow at phone and desktop sizes. Send the same worker a focused follow-up when proof or implementation is incomplete.
7. Do not accept placeholders, screenshots without interaction proof, tests that merely mirror implementation, weakened acceptance criteria, unrelated refactors, or a claim that a command passed without evidence.
8. When the issue meets its Done bar, merge it promptly into main using the repository's normal non-destructive workflow. Confirm main contains the commits and remains valid. Delete the short-lived branch if safe.
9. Comment on the GitHub issue with a compact evidence ledger: commits, checks, browser/screenshots, emulator/data proof, and any consciously deferred non-goal. Close the issue, remove next-step, and apply next-step to the next dependency-ready issue.
10. Repeat from step 1 without waiting for me.

Worker contract:
- One issue, one branch, no adjacent feature work.
- Read AGENTS.md, docs/devops.md, the product spec, roadmap, and live issue/comments before changes.
- Match existing Next.js, React, TypeScript, Firebase, validation, admin-auth, and visual conventions unless the issue explicitly changes them.
- Keep the generic /inquire path working for non-new-home inquiries.
- Keep Plan Your Home in its own versioned domain rather than stretching the flat generic inquiry form.
- Use a typed registry + pure reducer/persistence interfaces + seven bespoke illustrated React scenes.
- Use semantic DOM controls over decorative artwork. Do not create a hidden duplicate form.
- Use short CSS/WAAPI transforms and opacity for motion; do not add Remotion, XState, 3D, or a general scene DSL unless a later issue documents hard evidence that the planned approach cannot meet its contract.
- No production deploy, DNS change, real provider signup, marketing launch, or automated abandonment campaign.

Minimum review evidence:
- Every issue: focused tests, npm test, npm run lint, npm run typecheck.
- Changed UI: npm run review -- <changed routes>, phone and desktop screenshots inspected, no browser errors or horizontal overflow.
- Routes/forms/admin/data/storage/submission: npm run qa:smoke plus relevant emulator records/objects inspected.
- Final issue: npm run build and the complete product-spec acceptance scenario.

Final browser acceptance must exercise, not merely render:
1. At 390x844, enter a name and see it type onto the house plaque.
2. Complete all 35 questions across the seven fixed illustrated zones.
3. Refresh mid-zone and resume at the exact prompt.
4. Confirm the question-6 contact gate creates an HHQ-visible draft and later zones checkpoint.
5. Request the fake local resume email and continue from a separate browser context.
6. Add a PDF, image, and HTTPS link with notes; remove and replace one.
7. Edit an early answer from review without losing later answers.
8. Submit once and inspect the complete HHQ record, private files, links, status actions, and deletion behavior.
9. Complete representative interactions by keyboard with reduced motion enabled at mobile and desktop widths.
10. Submit a non-new-home inquiry through the preserved generic route.

Definition of done:
- All 18 Plan Your Home Tour milestone issues are closed with evidence and merged to main.
- No next-step label remains.
- The final acceptance path, standard gates, build, QA smoke, accessibility checks, and inspected visual review pass.
- No unrelated user work was overwritten or included.
- Start the supported local development environment, open /plan-your-home in the browser, keep it available for my review, and report the exact local URL plus a terse issue/commit/proof summary.
- Do not call the goal complete because the token budget is low or because an individual issue passed. Complete only at this real terminal state. If genuinely blocked, exhaust safe in-scope alternatives and report the exact blocker, evidence, and smallest user action required.
```
