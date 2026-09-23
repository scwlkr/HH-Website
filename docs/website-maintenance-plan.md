# Website maintenance plan

**Status:** Implementation in progress under [issue #46](https://github.com/scwlkr/HH-Website/issues/46). The activation and proof checklist below remains the completion gate.

## Scope and outcomes

Start with the public marketing routes already covered by `npm run review`: `/`, `/pricing`, `/projects`, `/faq`, and `/start`. Prioritize mobile speed and reliability. Keep the existing Plan Your Home and HHQ tests in the core test suite, but defer new performance audits for those flows.

Use automated lab checks only. Do not add visitor analytics, Vercel Speed Insights, or other field-data collection as part of this plan. Lighthouse can measure a controlled page load; it cannot establish real-visitor Interaction to Next Paint (INP) or continuous uptime.

## Existing foundation

The repo requires Node 24. `npm test`, `npm run lint`, and `npm run typecheck` cover code quality. `npm run qa:smoke` builds the production app and tests routes and user flows against isolated Firebase emulators with fake data. `npm run review -- <routes>` captures phone and desktop pages and checks HTTP errors, browser errors, and horizontal overflow. Plan Your Home also has a 24 KiB shared-scene budget and a layout-shift assertion in its final browser proof. See [Fast local review](devops.md) for current commands and change-specific gates.

## Proposed automation

| When | Check | Result |
| --- | --- | --- |
| Every pull request | On a standard GitHub-hosted runner, use Node 24, `npm ci`, Playwright Chromium, `npm test`, lint, typecheck, and `npm run qa:smoke`. The smoke command includes a production build. | Required status check on `main`; failed checks block merging. Keep owner review and manual merging. |
| Every pull request | Run Lighthouse CI three times per public route against a locally served production build, using mobile settings. Retain reports as short-lived GitHub artifacts. | Advisory performance results at first. Collect a stable baseline before choosing numeric merge-blocking budgets; do not gate on a single variable score. |
| Weekly | Request the deployed `/` and `/start` pages, assert successful responses and recognizable page content, and report a failed workflow through GitHub. | A weekly spot check of the deployed site, not continuous monitoring. `https://hh-website-pi.vercel.app` is the current candidate origin; confirm it when enabling the check and update it after a domain change. |
| Weekly and on security alerts | Let Dependabot propose grouped minor/patch npm and GitHub Actions updates, with a small open-PR limit. Keep major updates separate. | Reviewable PRs with the same CI checks; no automatic merge. |
| Monthly | A scheduled Codex audit reads recent CI/Lighthouse evidence, reruns focused checks where needed, and reports slow pages, repeated failures, outdated dependencies, and small refactoring candidates. | Short owner-facing summary. It may propose bounded GitHub issues, but does not edit code, create issues, or merge without a further request. |

The weekly check should run at a non-round minute to reduce the chance of GitHub schedule delays. Set the exact weekly and monthly times when enabling the schedules. GitHub workflow failure notifications require the owner's GitHub notification settings to be configured and checked during setup.

## Performance and refactoring policy

First record mobile Lighthouse results for all five routes from a production build. Compare repeated runs and inspect the reports before setting thresholds. Treat Lighthouse scores as a diagnostic; prefer stable assertions such as broken resources, avoidable asset growth, and the existing scene budget for hard gates. If the site later needs real-user responsiveness measurement, make a separate privacy and cost decision.

Make small, behavior-preserving cleanup in code already being changed, with focused verification. The monthly audit should identify larger cleanup as separate, reviewable work rather than start a broad rewrite. Track recurring failures, slow routes, and maintenance effort so the next change targets a measured problem.

## Activation and proof checklist

1. Add the PR workflow, Lighthouse configuration, weekly check, and Dependabot configuration. Enable the repository's dependency graph, Dependabot alerts, and security updates. Keep workflow permissions minimal and use emulator fixtures rather than production credentials.
2. Run the workflow on a PR under Node 24. Confirm all core checks pass and Lighthouse reports are available without uploading them to Lighthouse CI's temporary public storage.
3. Add branch protection requiring the successful core status check. Verify a failing check blocks a test PR and an advisory Lighthouse result does not.
4. Trigger the weekly check manually once, confirm it targets the current production URL, and verify failure notification delivery.
5. Start the monthly Codex audit only after the CI evidence exists. Confirm its first report cites actual runs and says when evidence is missing.
6. Update [Fast local review](devops.md) and this plan to reflect the actual commands, schedules, and owners after activation.

## Cost and limits

The repository is currently public. [GitHub Actions standard hosted runners are free for public repositories](https://docs.github.com/en/billing/concepts/product-billing/github-actions), and [Dependabot version updates are available for all GitHub repositories](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-version-updates). Keep Lighthouse artifacts short-lived because artifact storage has plan limits. The monthly Codex audit uses the account's Codex allowance according to the applicable plan. No paid monitoring service is included. Recheck cost and limits if repository visibility, runner type, or account plan changes.

Lighthouse runs vary even without a code change, so repeated measurements and a baseline precede hard speed thresholds ([Lighthouse variability guidance](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md)). GitHub scheduled workflows can be delayed or dropped under load, which is why the weekly check must not be presented as continuous uptime coverage ([GitHub workflow guidance](https://docs.github.com/en/actions/how-tos/troubleshoot-workflows)).
