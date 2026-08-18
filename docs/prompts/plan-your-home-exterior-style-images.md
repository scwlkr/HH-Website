# Prompt: Plan Your Home Exterior-Style Images

Use this contract when adding or regenerating an exterior-style card illustration. It preserves the owner-approved visual system established for issue #43.

## Fixed production contract

- Generate one fictional house per call; never generate a contact sheet as a production asset.
- Use approved production images as style references only. Do not copy their massing.
- Source canvas: exactly 1536 by 1024 pixels, landscape 3:2.
- Composition: straight-on orthographic front elevation, about 6% side margins, about 15% top margin, and one baseline about 82% down the canvas.
- Shipped asset: 768 by 512 WebP, quality 78, stripped metadata.
- Keep every line attached to a real architectural edge. No loose construction marks.
- Keep text and meaning in the DOM. Images contain no style names or other text.
- Before use, inspect the new image beside the complete catalog at phone and desktop sizes.

## Shared generation prompt

Replace `{STYLE_NAME}` and `{ARCHITECTURAL_IDENTITY}` from the approved cue matrix in `features/plan-your-home/exterior-style-catalog.ts`.

```text
Use case: stylized-concept
Asset type: production-candidate exterior-style card illustration for a phone-first custom-home selector
Reference use: Match the supplied approved samples exactly in architectural ink-and-watercolor visual language, line weight, restrained material color, warm paper texture, straight-on elevation viewpoint, spacing, and overall finish. References are style guidance only; do not copy their buildings.
Primary request: Create ONE standalone fictional {STYLE_NAME} custom home. Do not create a contact sheet, collage, comparison, border, or multiple buildings.
Architectural identity: {ARCHITECTURAL_IDENTITY}
Canvas and ratio: exact landscape 3:2 composition intended for 1536 by 1024 output. Keep all architecture within a common safe frame: about 6 percent side margins, 15 percent top margin, and the grounded baseline about 82 percent down the canvas.
Composition: straight-on orthographic front elevation, house centered and fully visible at a consistent medium-wide scale, exactly one thin horizontal grounded baseline, no perspective.
Style/medium: refined hand-inked architectural elevation with restrained translucent watercolor material washes; professional, controlled, and clearly non-photorealistic.
Mobile clarity: prioritize silhouette, roof geometry, porch, openings, and major material changes. Simplify tiny textures and ornamental micro-detail.
Background: uniform warm off-white architectural paper, clean and empty.
Line discipline: every visible line must describe an actual architectural edge, material boundary, window, door, porch support, or the single grounded baseline. All endpoints attach cleanly.
Constraints: no text, labels, letters, people, cars, garage clutter, landscaping, trees, shrubs, sky, loose shadows, logos, watermark, customer names, or specific site.
Avoid: floating or disconnected lines; sketch guides; duplicate roof outlines; unexplained diagonals; scribbles; debris; photorealism; 3D perspective; blueprint symbols; generic massing; cropped building; second house; decorative background marks.
```

## Optimization and verification

With `cwebp` installed, convert an approved 1536 by 1024 source:

```sh
cwebp -resize 768 512 -q 78 -m 6 -sharp_yuv -metadata none source.png -o public/images/plan-your-home/exterior-styles/{slug}.webp
```

Confirm all files are 768 by 512, each is no more than 50 KB, and the complete directory is no more than 700 KB. Run the exterior-style catalog test and inspect the isolated review sheet before landing changes.
