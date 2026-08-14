# ADR 0001: Keep Plan Your Home scenes as inline vector illustrations

- Status: Accepted
- Date: 2026-08-14

## Context

Plan Your Home now uses one coherent fictional illustrated home across seven
zones. The scenes share recurring architecture, openings, materials, light, and
construction marks while remaining conceptual rather than presenting a proposed
customer design.

The approved treatment has been applied throughout the walkthrough, so replacing
the scene medium would require reauthoring every zone and revalidating camera
framing, prompt anchors, transitions, responsive behavior, and reduced motion.
That makes the vector approach a consequential decision worth preserving.

## Decision

Keep each scene as hand-authored inline SVG rendered by its zone's React
component and styled by its colocated CSS module. Use the same artwork for phone
and desktop, with responsive framing and semantic prompt anchors controlling
focus. Customer answers must not reconfigure the fictional home.

## Rationale

Inline vectors support the approved sketched visual language, sharp responsive
rendering, small lazy-loaded scene groups, and direct control of anchor emphasis
and camera framing. They also avoid adding a rendering service, asset pipeline,
3D runtime, or customer-specific generation to a questionnaire whose output is a
project brief.

## Consequences

- New scene work must preserve the shared architectural and material language.
- Scene groups and adjacent pairs remain subject to the compressed budget proof.
- Decorative scene artwork remains hidden from assistive technology; the Prompt
  and controls carry the customer meaning.
- A future change to raster, 3D, or generated imagery requires a new decision and
  full visual, accessibility, performance, and journey qualification.
