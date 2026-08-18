# Use curated static exterior-style images

- Status: Accepted
- Date: 2026-08-18

Plan Your Home needs eighteen architecturally distinct exterior elevations that remain legible at phone size and consistent with the product's fictional, hand-rendered visual language. Owner review rejected the first hand-authored React SVG sheet because disconnected construction strokes read as debris and weakened the architecture. A five-style generated-image checkpoint then established an approved visual direction, and the owner approved extending it to the full catalog.

Use one curated generated illustration per exterior style, stored as a static WebP. Generate each house independently from the shared prompt contract in `docs/prompts/plan-your-home-exterior-style-images.md`, using approved samples as style references. Lock every source to a 3:2 straight-on elevation, then ship a 768 by 512 WebP. The visible native control and style name carry meaning; artwork is decorative.

This method gives each architecture enough fidelity to be recognizable while preserving consistent framing, accessibility, and a measurable asset budget. The complete eighteen-image set must remain at or below 700 KB. Regeneration is acceptable only when the same prompt contract, dimensions, review checkpoint, and asset checks are retained.
