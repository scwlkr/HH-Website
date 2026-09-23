# Website maintenance runbook

This runbook covers the automation in [the maintenance plan](website-maintenance-plan.md). Howeth and Harp retains owner review and manual merge. GitHub Actions and Dependabot do not serve the public website and are not required for the deployed site to run.

## Rollout state and ownership

The workflows and configuration landed on `main` in [PR #47](https://github.com/scwlkr/HH-Website/pull/47) on 2026-09-23. The pull request gate, weekly spot check, Dependabot security proposals, and monthly audit schedule are active. The first scheduled weekly check, grouped routine Dependabot update, and monthly audit report are still pending. Track those first-run checks on [issue #46](https://github.com/scwlkr/HH-Website/issues/46). The repository owner reviews failures, dependency proposals, and merges.

## Pull request checks

The core pull request workflow runs with Node 24 and locked npm dependencies. It runs `npm test`, `npm run lint`, `npm run typecheck`, and `npm run qa:smoke`; the smoke command builds the production app and uses local Firebase emulators and fake data. Inspect the pull request's Checks tab and its GitHub Actions run for errors. No production credentials or customer records belong in CI.

Mobile Lighthouse reports for `/`, `/pricing`, `/projects`, `/faq`, and `/start` are advisory. Open the run's short-lived Lighthouse artifact and compare the three runs per route with earlier results. Treat a missing report as a workflow failure, but do not block a merge based only on an uncalibrated numeric score. Use `npm run review -- <route>` and inspect the resulting screenshots when diagnosing a page.

`main` branch protection requires **Core quality**, including for administrators. [PR #47's core run](https://github.com/scwlkr/HH-Website/actions/runs/35873375663) passed on Node 24, and its [Lighthouse run](https://github.com/scwlkr/HH-Website/actions/runs/35873375670) retained three reports per route for seven days. Deliberately failing [test PR #48](https://github.com/scwlkr/HH-Website/pull/48) was blocked by the required core check and then closed.

## Weekly deployed-site spot check

`.github/workflows/live-spot-check.yml` runs Tuesdays at **09:17 America/Chicago** and supports a manual run from GitHub Actions. It requests `/` and `/start`, requires a successful HTML response, and checks visible brand and route-specific text. The current configured origin, `https://hh-website-pi.vercel.app`, returned HTTP 200 with expected content on 2026-09-23. Update the workflow origin after a production-domain change and repeat the manual proof. This is a weekly spot check, not uptime monitoring; GitHub may delay or miss a scheduled run.

To run the same check locally:

```bash
LIVE_SITE_ORIGIN=https://hh-website-pi.vercel.app node scripts/live-spot-check.mjs
```

For a manual run, select **Weekly live spot check** in GitHub Actions and leave `site_origin` blank. To test failure reporting, enter a controlled non-site HTTPS origin such as `https://example.com` and label the run as a test in the issue evidence. On 2026-09-23, the [default-origin run](https://github.com/scwlkr/HH-Website/actions/runs/35883279211) passed; the [controlled failure run](https://github.com/scwlkr/HH-Website/actions/runs/35883464699) named both failed routes, and the owner received its GitHub inbox notification. Email delivery was not checked.

On an unexpected failure, open the failed Actions run to identify the route and reason. Retry manually once, inspect both deployed pages in a browser, and check the current Vercel deployment and domain configuration. If the site is genuinely broken, repair or roll back the deployment using the normal release process. If content was intentionally changed, update the recognizable-content assertion in the checker and prove both routes again. Do not infer an outage from one scheduled failure.

## Dependency updates

`.github/dependabot.yml` checks npm on Mondays at **08:17 America/Chicago** and GitHub Actions on Mondays at **08:47 America/Chicago**. Each ecosystem groups minor and patch version updates; major versions remain separate. Version-update pull requests are limited to three npm and two Actions proposals at a time. Security-update proposals depend on the repository's dependency graph, Dependabot alerts, and Dependabot security updates being enabled in GitHub settings; confirm those settings separately. The version-update PR limits do not cap security proposals.

The dependency graph, alerts, and security-update proposals were enabled on 2026-09-23. Dependabot immediately opened separate security proposals, including [PR #57](https://github.com/scwlkr/HH-Website/pull/57), with the required core check. The first scheduled grouped routine proposal is pending. Review each proposal's changelog and pull request checks before manually merging. Confirm that the first routine proposal is grouped correctly and major updates remain separate. There is no automatic merge. If an update fails, inspect the failed job, split or defer the update as needed, and leave it unmerged until verified.

## Monthly review and evidence

The monthly Codex audit is active for the first Wednesday at **10:17 America/Chicago**; its first scheduled report is due 2026-10-07. It should cite specific Actions runs, Lighthouse artifacts, dependency proposals, and missing evidence; identify slow routes, recurring or flaky failures, and bounded cleanup candidates. It does not edit code, create issues, or merge without a later request. The first report must state when evidence is absent.

Keep evidence on issue #46 until the rollout is complete. The PR core run, Lighthouse baseline, branch-protection failure proof, manual spot-check pass and controlled failure with GitHub notification, and enabled dependency/security settings are verified. Still verify the first grouped routine Dependabot PR and monthly audit report. Close the issue only when its acceptance evidence is complete.

The public repository currently uses standard GitHub-hosted runners; the agreed plan expects no paid monitoring. Recheck GitHub Actions minutes/artifact retention and Codex allowance if repository visibility, runner type, artifact use, or account plan changes. No visitor performance telemetry is part of this system.
