# Fast Local Review

Use this loop for UI work. It is intentionally smaller than launch QA.

## Once Per Machine

```bash
npm install
npx playwright install chromium
```

## Iteration Loop

Keep the live site open:

```bash
npm run dev
npx playwright open http://127.0.0.1:3000
```

After a change, capture only touched routes:

```bash
npm run review -- /pricing
npm run review -- / /pricing /inquire
```

Plan Your Home remains an internal build route. Open it directly at
`http://127.0.0.1:3000/plan-your-home` or capture it with:

```bash
npm run review -- /plan-your-home
```

`npm run review` with no routes checks `/`, `/pricing`, `/projects`, `/faq`, and `/inquire`. It reuses the live server on port `3000`, or starts and stops an isolated dev server. Each route is checked at desktop and mobile sizes for HTTP failure, browser errors, and horizontal overflow.

Review these ignored artifacts:

- `output/playwright/latest/review-board.png` — one-image overview
- `output/playwright/latest/*.png` — full-page captures
- `output/playwright/latest/summary.json` — compact machine-readable result

Useful overrides:

```bash
REVIEW_VIEWPORTS=desktop npm run review -- /pricing
REVIEW_URL=http://127.0.0.1:3100 npm run review -- /pricing
```

## Gates

```bash
npm run lint && npm run typecheck
npm run qa:smoke
```

Use lint and typecheck before handoff. Use `qa:smoke` before merge when routes, forms, admin, metadata, links, or layout behavior changed; it builds production and uses isolated Firebase emulators.

## Plan Your Home Resume Email

Local and emulator browser proof uses the in-memory fake adapter only:

```bash
PLAN_HOME_RESUME_MAIL_TRANSPORT=fake
PLAN_HOME_RESUME_SECRET=<at-least-32-random-characters>
PLAN_HOME_PUBLIC_ORIGIN=http://localhost:3000
```

The fake mailbox is unavailable in production, retains messages only in the
running process, and removes a captured link when the local proof endpoint reads
it. Never print a resume link, email address, or raw token to terminal output or
retain one in screenshots.

Production delivery is deliberately unconfigured. After h and h provides a
verified sending domain and API key, set `PLAN_HOME_RESUME_MAIL_TRANSPORT=resend`,
`PLAN_HOME_RESUME_EMAIL_FROM`, `RESEND_API_KEY`, `PLAN_HOME_RESUME_SECRET`, and an
HTTPS `PLAN_HOME_PUBLIC_ORIGIN`. Keep all except the public origin server-only.
Provider/domain configuration and DNS changes require separate authorization.

Agent rule: inspect the changed-route screenshots before claiming UI completion. Never put secrets or private client data in screenshots.
