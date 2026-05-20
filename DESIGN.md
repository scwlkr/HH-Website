# Howeth and Harp Design

## Design Vision

Howeth and Harp should feel like a restrained, premium architectural website: calm, credible, precise, and low-pressure. The public experience exists to establish business credibility, show completed work, explain what the company does, and give serious project leads a clear path forward. The design should keep its drafting and architectural feel, but those cues must be subtle structural devices rather than a loud blueprint theme or a stack of decorative cards.

## Audience and Jobs

- Primary audience: high-intent property owners, developers, and serious project leads evaluating whether Howeth and Harp is credible and relevant for their work.
- Secondary audience: credibility-checking visitors who need to understand the business, review completed work, and see a polished public presence before contacting the company.
- Core user jobs:
  - Understand that Howeth and Harp provides architectural design, building, and land development.
  - See that completed work exists through the Projects surface.
  - Review finish/pricing posture without reading a commodity rate sheet.
  - Start a project brief only when ready.
- Non-goals:
  - Do not make the site feel like an inspiration blog, lifestyle portfolio, or generic contractor lead funnel.
  - Do not use generic stock imagery or fake-looking lifestyle visuals.
  - Do not fill pages with repeated CTA bands, sales copy, or "dream home" language.

## Product Shape

- Primary surfaces:
  - Homepage as a clean front door.
  - Projects as the primary proof surface.
  - Pricing as restrained finish-level explanation.
  - FAQ as compact objection-removal and support.
  - Inquiry as a functional project brief flow.
  - HHQ/admin as a denser operational surface.
- Main workflows:
  - Visitor lands on the homepage, understands the business, and can view Projects.
  - Visitor reviews completed work on Projects and project detail pages.
  - Visitor reviews Pricing/finish levels if scope or finish posture needs clarification.
  - Serious visitor starts the project brief through the header action or contextual links.
- Information architecture:
  - Active public header: Home, Projects, Pricing, FAQ, Start a Project.
  - Catalog remains in the codebase but is dormant public IA for now.
  - Catalog should be hidden from public header, homepage, and footer until intentionally revisited.
  - Projects is visible even during the design/build preview phase with refined placeholder imagery while final media is gathered.
- Navigation model:
  - The header carries most navigation.
  - The content should not constantly re-sell navigation with large CTA sections.
  - Footer navigation should be minimal and only include necessary page links, contact, and legal links.
- Content hierarchy:
  - Homepage includes only the landing section, "What Howeth and Harp Does", and a compact FAQ.
  - Homepage hero headline: "Advancing design, building, and land development."
  - Homepage hero subhead: "Howeth and Harp delivers architectural design, building, and land development with a disciplined eye for scope, site, and finish."
  - Homepage hero has one understated action: View Projects.
  - "What Howeth and Harp Does" remains three concise capability blocks: Architectural Design, Building, and Land Development.
  - Homepage FAQ should be compact, about four high-value questions, with no CTA band.

## Visual System

- Overall tone:
  - Premium, architectural, clean, calm, credible, and low-pressure.
  - Drafting-inspired, but not playful, busy, or blueprint-themed.
- Layout rules:
  - Prefer open page rhythm, alignment, columns, dividers, and bands over repeated isolated cards.
  - Avoid the feeling that content blocks were copy-pasted onto the page.
  - The hero may keep a drafting-sheet identity, but it should be lighter, flatter, and more integrated with the page background.
  - Below the hero, structure should come from spacing, alignment, and subtle rules rather than heavy card containment.
- Color direction:
  - Keep warm architectural paper, near-black ink, muted text, clean white surfaces, and deep green accent.
  - Tighten color usage so green is reserved for primary emphasis and key labels.
  - Beige should feel clean and architectural, not sepia, aged, or muddy.
  - White surfaces should keep the system crisp.
- Typography direction:
  - Keep IBM Plex Sans as the website body/display font.
  - Keep IBM Plex Mono for labels, technical texture, and utilities.
  - Do not reintroduce Panchang unless the brand guide is intentionally updated again.
  - Tiny all-caps mono labels should remain secondary texture only.
  - Primary navigation, buttons, headings, and important content should prioritize readability over extreme letter spacing.
- Icon, image, and media direction:
  - Use real project imagery, brand assets, or subtle abstract drafting geometry.
  - Do not use generic stock/lifestyle imagery.
  - Project placeholders should be premium stand-ins with consistent crop, tone, and aspect ratio, not gray boxes or loud "image pending" badges.
  - The animated drafting arm stays as a signature detail, but it should feel integrated, subtle, and architectural.
- Density and spacing:
  - Public pages should feel open and flowing without becoming sparse or empty.
  - Project and detail surfaces should be image-led and quiet.
  - HHQ/admin should remain denser and more operational than the public site.

## Interaction Model

- Primary actions:
  - Header retains a restrained Start a Project action.
  - Homepage hero uses one understated View Projects action.
  - Avoid repeated funnel CTAs and bottom-page CTA bands unless a context-specific link genuinely helps.
- Controls:
  - Buttons should stay small-radius, rectangular, and architectural.
  - Avoid pill-heavy, soft SaaS styling.
  - Forms should remain functional, readable, and hard to misuse.
- Feedback:
  - Default states should be subtle.
  - Hover, focus, active, error, and disabled states should become unmistakable when the user interacts.
  - Accessibility and clarity win without making the styling loud.
- Loading, empty, and error states:
  - Projects can be visible during build with refined placeholders while final project media is pending.
  - A public-facing "0 completed homes" state is not the desired design surface.
  - Empty and fallback states should look intentional and premium during previews.
- Motion:
  - Motion is limited to subtle architectural behavior.
  - The drafting arm may animate slowly and quietly.
  - Use light hover/focus transitions only.
  - No scroll theatrics, parallax, reveal animations, or attention-seeking movement.
- Keyboard and pointer behavior:
  - Keep visible focus states and full keyboard access.
  - Mobile targets must be comfortably tappable.
  - Whole project cards can link to detail pages; avoid repeated card CTA buttons.

## Responsive and Accessibility Requirements

- Mobile behavior:
  - Preserve the same premium restraint with clean stacking and reduced decoration.
  - Do not force the full desktop drafting-board composition into mobile.
  - The drafting arm can remain only if it does not create awkward vertical space.
- Tablet behavior:
  - Preserve columns where they remain readable.
  - Collapse framed elements before they feel cramped.
- Desktop behavior:
  - Let the layout breathe through generous alignment, linework, and image proportion.
  - Avoid heavy nested cards and repeated page frames.
- Keyboard access:
  - Header, footer, FAQ rows, project links, forms, and controls must be keyboard reachable.
  - Focus states must be visible and refined.
- Contrast and readability:
  - Subtle styling must not become faint or fragile.
  - Body copy, form labels, nav, buttons, and FAQ rows need comfortable contrast.
- Screen-reader considerations:
  - Decorative drafting marks and abstract geometry should be hidden from assistive tech.
  - Real project imagery needs useful alt text.
  - Inquiry progress must remain understandable to screen readers.

## Technical and Product Constraints

- Existing code constraints:
  - The app is a Next.js App Router project using React, TypeScript, and Tailwind CSS v4.
  - Current public tokens live in `styles/tokens.css`.
  - Shared public components include site header, footer, hero, sections, cards, buttons, project cards, and inquiry components.
  - Existing brand guide locks naming and says not to reintroduce Panchang unless intentionally updated.
- Framework/design-system constraints:
  - Keep using the current IBM Plex Sans / IBM Plex Mono direction.
  - Keep small-radius architectural geometry.
  - Reduce overuse of boxed panels and decorative drafting details.
  - Production public site remains light-only for now.
  - `DESIGN.html` includes a light/dark visualizer only because the design-refine artifact requires that toggle.
- Data and integration constraints:
  - Projects are backed by managed data and should become the proof surface.
  - Final media is pending; placeholders are acceptable for design/build preview.
  - Do not expose private project data, private operational URLs, client data, credentials, or secret values.
- Performance constraints:
  - Keep the public site fast, server-rendered, and low on unnecessary runtime behavior.
  - Do not add heavy animation libraries or production dark-mode complexity for this direction.
- Launch or scope constraints:
  - The current design vision does not require deleting Catalog, only hiding it from active public IA.
  - Projects must be polished with intentional placeholder behavior until real media is available.
  - The footer should be minimal, light, and necessary only.

## Decision Log

| Decision | Rationale | Rejected Alternatives |
| --- | --- | --- |
| Optimize for high-intent leads and credibility-checking visitors. | The site is for business credibility and serious project evaluation. | Casual inspiration-browsing homepage, lifestyle-first positioning. |
| Homepage includes only hero, What Howeth and Harp Does, and compact FAQ. | Keeps the site lean, premium, and low-pressure. | Finish previews, build-type previews, inquiry bands, proof grids, long homepage. |
| Projects stays visible; Catalog is dormant public IA. | Completed work is stronger proof than an educational category catalog. | Hiding Projects, renaming Catalog into a proof archive, deleting Catalog now. |
| Header shows Home, Projects, Pricing, FAQ, and Start a Project. | Lean navigation supports a sleek premium feel. | Keeping Catalog in nav, adding more public sections. |
| Keep Pricing label for now. | User explicitly chose not to change the nav label. | Renaming Pricing to Finish Levels now. |
| Hero headline changes to "Advancing design, building, and land development." | Shorter, premium, aligned with the business. | Keeping the current longer coordination headline. |
| Hero subhead becomes credibility-first. | Supports the new shorter headline without overexplaining the funnel. | Operational process-heavy subhead. |
| Hero uses one understated View Projects action. | Proof-first and lower pressure than repeated Start a Project CTAs. | Two-button hero, no hero action, sales-first action. |
| Keep drafting architectural feel, but make it subtle and premium. | The current identity is good but needs tighter restraint. | Blueprint cosplay, playful drafting theme, decorative overload. |
| Keep the animated drafting arm, but integrate it more subtly. | It can be a signature detail if not loud. | Removing it entirely, making it the dominant hero gimmick. |
| Keep IBM Plex Sans and IBM Plex Mono. | Already fits the technical/premium direction and brand guide. | Font hunt, Panchang return. |
| Tighten the warm paper / ink / green palette. | The palette works if green and beige are disciplined. | Sepia-heavy pages, decorative green everywhere. |
| Reduce the isolated-card-stack feeling. | Premium flow should come from rhythm, alignment, and subtle section structure. | Heavy repeated boxed panels. |
| Use only real project imagery, brand assets, or subtle drafting geometry. | Fake imagery damages credibility. | Generic stock/lifestyle imagery. |
| Projects is image-led, quiet, and archival. | Proof should feel controlled and premium, not like another funnel page. | Heavy CTA bands, salesy card buttons, operational empty states. |
| Public copy stays precise, calm, and confident. | Matches the premium, low-pressure visual system. | Dream-home language, clever taglines, overexplained process copy. |
| Footer is minimal and link-focused, with no CTA block. | The site should end with confidence, not another pitch. | Large footer headline, CTA buttons, newsletter-like clutter. |
| Inquiry remains functional and form-first. | Users do work there, so clarity matters more than editorial spaciousness. | Making forms too sparse or atmospheric. |
| Accessibility is subtle by default and unmistakable on interaction. | Premium can still be clear and usable. | Faint inaccessible styling, loud generic states. |
| Production public site stays light-only for now. | The warm architectural paper system is the brand feel. | Adding production dark mode now. |

## Open Questions

| Question | Why It Matters | Status |
| --- | --- | --- |
| What final project imagery will replace placeholders? | Projects is the main proof surface, so real images will heavily affect design quality. | Pending media collection. |
| Which project metadata should be public on cards and detail pages? | The design calls for minimal useful facts, but exact fields depend on available records. | Pending project content review. |
| Should dormant Catalog eventually be removed, renamed, or rebuilt? | It remains hidden for now, but future public IA may need a category/service surface. | Parked. |
| Which four homepage FAQ questions should be canonical? | The homepage FAQ should be compact and high-value. | Pending content pass. |

## DESIGN.html Sync Notes

The paired `DESIGN.html` is a fixed static mock website visualizer, not a production-page preview, documentation page, or editable color tool.

- It uses a token layer for fonts, colors, radius, spacing, shadows, and component styling.
- It includes only one runtime control: a top-right round lightbulb switch for light/dark mode.
- It keeps the `DESIGN-FORMAT.html` mock website section order, section purposes, labels, placeholder copy, and generic pricing/testimonials/FAQ/articles content.
- The fixed sections are stable visual stress tests, not claims about Howeth and Harp's actual product model.
- Howeth and Harp design choices are expressed through tokens and styling across the fixed UI examples.
- The real project language and product decisions live in this `DESIGN.md`.
