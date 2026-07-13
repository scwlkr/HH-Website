# Public Copy Design Review

**Date:** July 13, 2026
**Reviewed:** All public routes at desktop and mobile breakpoints

## Overall finding

The architectural drafting system is visually cohesive, but several pages used internal product language, implementation notes, or temporary content as customer-facing copy. The visual hierarchy worked; the voice did not consistently sound public.

## Resolved findings

### High priority

- Removed three seeded demonstration projects from public listings, detail routes, and the sitemap.
- Added an explicit draft/published control so new and legacy project records remain private unless deliberately published.
- Removed copy describing routes, slugs, page structure, admin workflows, photography status, and placeholder behavior.

### Medium priority

- Rewrote pricing, catalog, FAQ, inquiry, confirmation, legal, metadata, and staff-login copy in direct customer language.
- Replaced internal fallback labels such as pending benchmarks with useful scope-review language.
- Reworked the visible placeholder artwork so it reads as an intentional architectural study.

## What remains strong

- The restrained grid, register labels, rules, and drawing marks create a distinct architectural identity.
- Short titles and quieter supporting copy now produce a more mature hierarchy.
- Pricing, project categories, and FAQs retain clear navigation without explaining the site itself.

## Verification evidence

- `output/playwright/copy-audit/core-pages.png`
- `output/playwright/copy-audit/catalog-pages.png`
- `output/playwright/copy-audit/support-pages.png`

All 28 desktop/mobile captures passed layout review. A rendered-text scan covered 17 public routes and found no blocked internal-copy phrases. Three unpublished project URLs returned 404.
