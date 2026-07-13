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

Agent rule: inspect the changed-route screenshots before claiming UI completion. Never put secrets or private client data in screenshots.
