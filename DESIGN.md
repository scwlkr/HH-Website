---
version: alpha
name: Howeth and Harp Design System
description: Restrained architectural drafting system for the Howeth and Harp public site, inquiry flow, project proof surfaces, and HHQ workspace.
colors:
  primary: "#005B41"
  on-primary: "#F9F6EF"
  primary-strong: "#004331"
  secondary: "#EDE5D6"
  on-secondary: "#11110F"
  tertiary: "#232D3F"
  on-tertiary: "#FFFFFF"
  neutral: "#F4EFE5"
  surface: "#FFFFFF"
  surface-strong: "#FAF7F0"
  on-surface: "#11110F"
  muted: "#5D564B"
  muted-strong: "#40392F"
  error: "#004331"
  on-error: "#FFFFFF"
  admin-background: "#090D12"
  admin-surface: "#111821"
  admin-on-surface: "#EFF4F7"
  admin-muted: "#93A2AD"
  admin-accent: "#7F96A7"
typography:
  headline-display:
    fontFamily: "IBM Plex Sans"
    fontSize: 58px
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: 0em
  headline-lg:
    fontFamily: "IBM Plex Sans"
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: 0em
  headline-md:
    fontFamily: "IBM Plex Sans"
    fontSize: 30px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0em
  body-lg:
    fontFamily: "IBM Plex Sans"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.78
    letterSpacing: 0em
  body-md:
    fontFamily: "IBM Plex Sans"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0em
  body-sm:
    fontFamily: "IBM Plex Sans"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0em
  label-md:
    fontFamily: "IBM Plex Mono"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.1em
  label-sm:
    fontFamily: "IBM Plex Mono"
    fontSize: 10px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.28em
rounded:
  none: 0px
  sm: 4px
  md: 6px
  lg: 7px
  xl: 10px
  full: 9999px
spacing:
  "2xs": 8px
  xs: 12px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  "2xl": 96px
components:
  page-shell:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
  public-header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.none}"
    height: 76px
  nav-link:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  nav-link-hover:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: 44px
  button-primary-hover:
    backgroundColor: "{colors.primary-strong}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: 44px
  button-secondary-hover:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: 48px
  input-field-focus:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
  field-error:
    textColor: "{colors.error}"
    typography: "{typography.body-sm}"
  badge-error:
    backgroundColor: "{colors.error}"
    textColor: "{colors.on-error}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  interactive-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  paper-band:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
  visualizer-panel:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  drafting-mark:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    rounded: "{rounded.sm}"
    width: 1px
    height: 72px
  route-intro:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.none}"
    padding: "{spacing.2xl}"
  specification-register:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.none}"
    padding: "{spacing.md} 0"
  project-register:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg} 0"
  status-badge:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted-strong}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  admin-panel:
    backgroundColor: "{colors.admin-surface}"
    textColor: "{colors.admin-on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  admin-shell:
    backgroundColor: "{colors.admin-background}"
    textColor: "{colors.admin-on-surface}"
  admin-nav-link:
    backgroundColor: "{colors.admin-surface}"
    textColor: "{colors.admin-muted}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  admin-nav-link-active:
    backgroundColor: "{colors.admin-accent}"
    textColor: "{colors.admin-background}"
---

# Howeth and Harp Design

## Overview

Howeth and Harp should feel like a restrained, premium architectural website: calm, credible, precise, and low-pressure. The public experience exists to establish business credibility, show completed work, explain what the company does, and give serious project leads a clear path forward. Drafting and architectural cues are part of the identity, but they must behave as subtle structural devices rather than a loud blueprint theme or a stack of decorative cards.

The primary audience is high-intent property owners, developers, and serious project leads evaluating whether Howeth and Harp is credible and relevant for their work. The secondary audience is credibility-checking visitors who need to understand the business, review completed work, and see a polished public presence before contacting the company.

Core public jobs are to explain that Howeth and Harp provides architectural design, building, and land development; show completed work through Projects; explain finish and pricing posture without becoming a commodity rate sheet; and let ready visitors start a project brief. The site must not become an inspiration blog, lifestyle portfolio, generic contractor lead funnel, or stock-image marketing page.

The active public surfaces are the homepage, Projects, Pricing, FAQ, Inquiry, and legal pages. HHQ/admin is a separate, denser operational surface. The active public header is Home, Projects, Pricing, FAQ, and Start a Project. Catalog remains in the codebase but is dormant public IA until intentionally revisited.

The homepage stays lean: landing section, "What Howeth and Harp Does", and a compact FAQ. The hero headline is "Advancing design, building, and land development." The hero subhead is "Howeth and Harp delivers architectural design, building, and land development with a disciplined eye for scope, site, and finish." The hero has one understated action: View Projects.

## Colors

The color system uses warm architectural paper, near-black ink, clean white surfaces, muted text, deep green emphasis, and restrained drafting ink. Beige must feel clean and architectural, not sepia, aged, or muddy. White surfaces keep the system crisp.

| Token | Value | Use |
| --- | --- | --- |
| `colors.neutral` | `#F4EFE5` | Public page background and warm paper field. |
| `colors.secondary` | `#EDE5D6` | Deeper paper tone for quiet secondary surfaces. |
| `colors.surface` | `#FFFFFF` | Primary content surfaces, cards, header, menus, and form controls. |
| `colors.surface-strong` | `#FAF7F0` | Slightly warm raised surface in the visualizer and secondary panels. |
| `colors.on-surface` | `#11110F` | Main ink color for body text, headings, and key UI. |
| `colors.muted` | `#5D564B` | Supporting copy, metadata, and lower-emphasis navigation. |
| `colors.muted-strong` | `#40392F` | Higher-contrast secondary text and compact tags. |
| `colors.primary` | `#005B41` | Green accent for primary emphasis, key labels, links, and focus states. |
| `colors.primary-strong` | `#004331` | Hover emphasis and current form error text behavior. |
| `colors.tertiary` | `#232D3F` | Drafting ink and deep technical accent. |
| `colors.admin-background` | `#090D12` | HHQ/admin workspace background. |
| `colors.admin-surface` | `#111821` | HHQ/admin panel surface. |

Green is reserved for real emphasis and key labels. It should not become a decorative wash across the page. Drafting ink appears as faint linework, grid detail, or technical accents rather than large color blocks. The production public site remains light-only for now; the `DESIGN.html` light/dark toggle exists only for the visual audit artifact.

No separate red error palette has been established in the current implementation. The `error` token records the current accent-strong behavior so existing form styling stays documented, but destructive or high-risk workflows should revisit this token instead of silently expanding green as an error color.

## Typography

IBM Plex Sans is the website body and display font. IBM Plex Mono is reserved for labels, technical texture, utilities, small metadata, and drafting-sheet cues. Panchang must not be reintroduced on the website unless the brand guide is intentionally updated again.

Headings use IBM Plex Sans with moderate weight, zero letter spacing, and tight-but-readable line height. The hero display treatment is large and calm, not decorative. Body text uses generous line height for credibility and scanning. Tiny all-caps mono labels remain secondary texture only; primary navigation, buttons, headings, and important content prioritize readability over extreme letter spacing.

Use `typography.headline-display` for first-viewport hero hierarchy, `typography.headline-lg` for major section titles, `typography.headline-md` for card and subsection headings, `typography.body-md` or `typography.body-lg` for explanatory copy, and mono label tokens only for short UI labels, metadata, dividers, and tags.

## Layout & Spacing

The layout should feel open and flowing without becoming sparse. Structure comes from alignment, columns, dividers, measured bands, image proportion, and subtle rules instead of repeated isolated cards. The system should avoid the feeling that content blocks were copy-pasted onto the page.

Container widths mirror the implementation: narrow content around `46rem`, content pages around `72rem`, and wide layouts around `84rem`. Page gutters use responsive padding so content remains comfortably readable on mobile, tablet, and desktop. Public sections use calm vertical rhythm: compact internal spacing for operational controls, more generous spacing for public proof and explanation.

The homepage is intentionally short. Projects is the primary proof surface and should be image-led, quiet, and archival. Pricing explains finish levels without reading like a rate sheet. FAQ is compact objection-removal. Inquiry is a functional project brief flow where clarity beats editorial spaciousness. HHQ/admin stays denser and more operational than the public site.

Public routes use one visual grammar without sharing one rigid template. Route intros behave as open cover sheets. Pricing uses finish schedules and a comparison matrix. Projects uses an archival register and image plates. FAQ uses grouped question registers. Legal pages use numbered clauses. Inquiry keeps the form as the single large contained work surface and moves progress and next-step guidance into open margin notes. Catalog remains outside active navigation but follows the same register system so dormant routes do not preserve an older card language.

On mobile, preserve premium restraint with clean stacking and reduced decoration. Do not force the full desktop drafting-board composition into mobile. On tablet, preserve columns only while they remain readable. On desktop, let the layout breathe through linework, image ratio, and horizontal alignment, not heavy nested frames.

## Elevation & Depth

Depth is quiet. Use hairline borders, tonal stacking, subtle inset highlights, low shadows, and occasional backdrop blur for sticky or floating surfaces. Avoid large soft SaaS shadows, glossy depth, and repeated panel-on-panel stacking.

Public pages should usually prefer a flat architectural sheet feel. Cards and panels may lift just enough to separate interactive or repeated items, but hierarchy should mostly come from spacing, linework, contrast, and typography. The header can use a light sticky treatment and a restrained bottom rule. HHQ/admin may use stronger dark-surface layering because it is an operational workspace.

Loading, empty, and fallback states should look intentional and premium during previews. Projects can be visible during build with refined placeholders while final project media is pending; a public-facing "0 completed homes" feeling is not the desired surface.

## Shapes

Shapes are small-radius, rectangular, and architectural. Use `rounded.sm`, `rounded.md`, and `rounded.lg` for most interface atoms. Avoid pill-heavy, soft SaaS styling. The only `rounded.full` use should be for true circular controls or rare utility affordances such as the `DESIGN.html` lightbulb toggle.

Images and project placeholders should use consistent crops, quiet borders, and controlled aspect ratios. Project placeholders need to feel like premium stand-ins with architectural linework, not gray boxes or loud "image pending" badges.

Icons, marks, and decorative geometry should feel drafted, precise, and understated. Decorative drafting marks and abstract geometry are hidden from assistive tech. Real project imagery needs useful alt text.

## Components

Buttons stay compact, mono-labeled, small-radius, and rectangular. Primary buttons use green only when the action needs real emphasis. Secondary buttons are white or paper-toned with restrained borders. Hover and focus states must be visible, but not loud. Disabled states reduce opacity and block pointer interaction.

Navigation is lean and header-led. The header carries most navigation. Content should not constantly re-sell navigation through large CTA sections. Footer navigation is minimal and includes necessary page links, contact, and legal links.

Forms are functional, readable, and hard to misuse. Inputs use white or raised surfaces, clear labels, strong enough contrast, and visible focus rings. Inquiry progress must remain understandable to screen readers.

Project records link as whole register rows and avoid repeated card CTA buttons. The first record may act as a wider cover sheet; later records remain continuous ruled entries. Projects should be image-led, quiet, and proof-oriented. Badges and metadata stay compact and secondary.

Static marketing content should not use `CardShell`. Use open rules, schedules, registers, title blocks, and image plates. `CardShell` remains appropriate for the active inquiry form and other genuinely interactive work surfaces where containment improves comprehension.

The animated drafting arm remains a signature detail only if it is integrated, subtle, and architectural. Motion is limited to subtle architectural behavior, light hover/focus transitions, and slow quiet signature movement. Do not add scroll theatrics, parallax, reveal animations, or attention-seeking movement.

The paired `DESIGN.html` is a fixed static mock website visualizer, not a production-page preview, documentation page, or editable color tool. It uses the same token direction to stress test fonts, colors, hierarchy, buttons, cards, sections, and states.

## Do's and Don'ts

Do keep the site calm, precise, premium, architectural, and low-pressure.

Do use real project imagery, brand assets, or subtle abstract drafting geometry.

Do keep Projects visible as the main proof surface while final media is gathered.

Do keep the Pricing label for now.

Do keep public copy precise, confident, and free of "dream home" language.

Do make accessibility states visible and refined: focus, hover, active, error, and disabled states must be unmistakable during interaction.

Do keep the footer minimal, light, and necessary.

Don't turn the drafting direction into blueprint cosplay, playful illustration, or decorative overload.

Don't use generic stock imagery, fake lifestyle visuals, or loud placeholder badges.

Don't reintroduce Panchang unless the brand guide changes intentionally.

Don't add repeated funnel CTAs, bottom-page CTA bands, newsletter-style footer clutter, or sales-heavy card buttons.

Don't bring Catalog back into public navigation, homepage, or footer until that surface is intentionally revisited.

Don't add production dark-mode complexity just because the design visualizer has a dark-mode switch.
