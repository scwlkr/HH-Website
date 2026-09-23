# Website maintenance runbook

This runbook covers the automation in [the maintenance plan](website-maintenance-plan.md). H and H retains owner review and manual merge. GitHub Actions and Dependabot do not serve the public website and are not required for the deployed site to run.

## Rollout state and ownership

Issue #46 stages the workflows and configuration. A successful local command or an open pull request does not prove repository settings, GitHub notifications, a scheduled run, or merge protection. Record those checks on the issue before calling the system active. The repository owner reviews failures, dependency proposals, and merges.

## Pull request checks

The core pull request workflow runs with Node 24 and locked npm dependencies. It runs `npm test`, `npm run lint`, `npm run typecheck`, and `npm run qa:smoke`; the smoke command builds the production app and uses local Firebase emulators and fake data. Inspect the pull request's Checks tab and its GitHub Actions run for errors. No production credentials or customer records belong in CI.

Mobile Lighthouse reports for `/`, `/pricing`, `/projects`, `/faq`, and `/start` are advisory. Open the run's short-lived Lighthouse artifact and compare the three runs per route with earlier results. Treat a missing report as a workflow failure, but do not block a merge based only on an uncalibrated numeric score. Use `npm run review -- <route>` and inspect the resulting screenshots when diagnosing a page.

After the first successful real pull request run, configure `main` branch protection to require the **core** status check and owner review. Verify that a deliberately failing core check blocks a test pull request, while an advisory Lighthouse score remains visible without blocking it. Until this repository setting is verified, a green check is evidence of execution, not a merge gate.

## Weekly deployed-site spot check

`.github/workflows/live-spot-check.yml` runs Tuesdays at **09:17 America/Chicago** and supports a manual run from GitHub Actions. It requests `/` and `/start`, requires a successful HTML response, and checks visible brand and route-specific text. The current configured origin, `https://hh-website-pi.vercel.app`, returned HTTP 200 with expected content on 2026-09-23. Update the workflow origin after a production-domain change and repeat the manual proof. This is a weekly spot check, not uptime monitoring; GitHub may delay or miss a scheduled run.

To run the same check locally:

```bash
LIVE_SITE_ORIGIN=https://hh-website-pi.vercel.app node scripts/live-spot-check.mjs
```

For activation, manually run **Weekly live spot check** with the default origin and confirm both route results. Then use the workflow's `site_origin` input with a controlled non-site HTTPS origin, such as `https://example.com`, to confirm the failure path. Label that run as a test in the issue evidence. Verify the owner's GitHub Actions failure notifications in their notification settings and by receipt; workflow failure alone does not prove delivery.

On an unexpected failure, open the failed Actions run to identify the route and reason. Retry manually once, inspect both deployed pages in a browser, and check the current Vercel deployment and domain configuration. If the site is genuinely broken, repair or roll back the deployment using the normal release process. If content was intentionally changed, update the recognizable-content assertion in the checker and prove both routes again. Do not infer an outage from one scheduled failure.

## Dependency updates

`.github/dependabot.yml` checks npm on Mondays at **08:17 America/Chicago** and GitHub Actions on Mondays at **08:47 America/Chicago**. Each ecosystem groups minor and patch version updates; major versions remain separate. Version-update pull requests are limited to three npm and two Actions proposals at a time. Security-update proposals depend on the repository's dependency graph, Dependabot alerts, and Dependabot security updates being enabled in GitHub settings; confirm those settings separately. The version-update PR limits do not cap security proposals.

Review each proposal's changelog and pull request checks before manually merging. Confirm that the first routine proposal is grouped correctly, any major update is separate, and the required core check runs. There is no automatic merge. If an update fails, inspect the failed job, split or defer the update as needed, and leave it unmerged until verified.

## Monthly review and evidence

After real CI and Lighthouse runs exist, enable the monthly Codex audit for the first Wednesday at **10:17 America/Chicago**. It should cite specific Actions runs, Lighthouse artifacts, dependency proposals, and missing evidence; identify slow routes, recurring or flaky failures, and bounded cleanup candidates. It does not edit code, create issues, or merge without a later request. The first report must state when evidence is absent.

Keep evidence on issue #46 until the rollout is complete: a successful real PR core run; Lighthouse reports and baseline; branch-protection failure proof; default and controlled-failure spot-check runs plus received notification; enabled dependency/security settings and the first Dependabot PR; and the first monthly audit. After landing on `main`, close the issue only when its acceptance evidence is complete.

The public repository currently uses standard GitHub-hosted runners; the agreed plan expects no paid monitoring. Recheck GitHub Actions minutes/artifact retention and Codex allowance if repository visibility, runner type, artifact use, or account plan changes. No visitor performance telemetry is part of this system.
