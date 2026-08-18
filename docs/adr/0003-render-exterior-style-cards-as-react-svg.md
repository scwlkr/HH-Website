# Render exterior style cards as React SVG

- Status: Accepted
- Date: 2026-08-18

Plan Your Home needs eighteen architecturally distinct exterior elevations that remain crisp at phone size and visually consistent with its fictional hand-sketched home. Generated raster imagery was rejected because fidelity and rendering vary between styles and future edits require regenerating artwork. Separate static SVG assets were viable, but they would duplicate shared framing and material rules across files and make theme-level changes harder to verify.

Use hand-authored inline SVG rendered by React with shared sketch, material, and construction-line styles. Keep the artwork decorative while the native card control and visible style name carry meaning. This method preserves direct architectural control, responsive clarity, accessibility, maintainability, and the existing asset-budget proof; generated imagery may inform exploration but does not ship.
