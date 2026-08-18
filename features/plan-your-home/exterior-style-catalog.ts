export type ExteriorStyleDefinition = Readonly<{
  slug: string;
  label: string;
  form: string;
  roof: string;
  openings: string;
  porch: string;
  materials: string;
  details: string;
}>;

export const exteriorStyleCatalog = [
  {
    slug: "acadian",
    label: "Acadian",
    form: "Raised, simple one-and-a-half-story form",
    roof: "Steep gable with dormers",
    openings: "Tall doors and windows with shutters",
    porch: "Full-width gallery",
    materials: "Clapboard, brick, and stucco",
    details: "Raised base and slender posts",
  },
  {
    slug: "barndominium",
    label: "Barndominium",
    form: "Long, simple barn volume",
    roof: "Single steep gable",
    openings: "Large rectangular living and shop openings",
    porch: "Lean-to porch",
    materials: "Metal, wood, and stone",
    details: "Post frame and cross-bracing",
  },
  {
    slug: "cape-cod",
    label: "Cape Cod",
    form: "Compact, symmetrical one-and-a-half-story form",
    roof: "Steep side gable with dormers",
    openings: "Ordered multi-pane windows",
    porch: "Small centered stoop",
    materials: "Shingles and clapboard",
    details: "Shutters and central chimney",
  },
  {
    slug: "colonial-revival",
    label: "Colonial Revival",
    form: "Balanced two-story rectangle",
    roof: "Side gable or hip with dormers",
    openings: "Ordered multi-pane bays",
    porch: "Centered portico",
    materials: "Brick and clapboard",
    details: "Pediment, pilasters, and fanlight",
  },
  {
    slug: "contemporary",
    label: "Contemporary",
    form: "Offset asymmetrical volumes",
    roof: "Flat and shed planes",
    openings: "Large, irregular glazing",
    porch: "Recessed terrace",
    materials: "Wood, stone, metal, and glass",
    details: "Screens, frames, and cantilevers",
  },
  {
    slug: "craftsman",
    label: "Craftsman",
    form: "Compact, grounded asymmetry",
    roof: "Low gables",
    openings: "Grouped windows",
    porch: "Deep front porch",
    materials: "Wood, shingles, and stone",
    details: "Tapered piers, exposed rafters, and braces",
  },
  {
    slug: "french-country",
    label: "French Country",
    form: "Tall, irregular massing",
    roof: "Steep hips and gables",
    openings: "Tall casements with shutters",
    porch: "Modest covered entry",
    materials: "Stone, stucco, and brick",
    details: "Dormers and tall chimneys",
  },
  {
    slug: "greek-revival",
    label: "Greek Revival",
    form: "Symmetrical temple form",
    roof: "Low pedimented gable",
    openings: "Tall multi-pane windows",
    porch: "Full colonnade",
    materials: "Clapboard, stucco, and brick",
    details: "Columns, entablature, and sidelights",
  },
  {
    slug: "mediterranean",
    label: "Mediterranean",
    form: "Formal two-story villa",
    roof: "Low clay-tile hip",
    openings: "Tall arched casements",
    porch: "Loggia or balcony",
    materials: "Stucco, stone, and clay tile",
    details: "Cornice, ironwork, and columns",
  },
  {
    slug: "mid-century-modern",
    label: "Mid-century modern",
    form: "Low horizontal pavilions",
    roof: "Flat or low gable",
    openings: "Glass walls and clerestories",
    porch: "Recessed entry",
    materials: "Wood, brick, and glass",
    details: "Post-and-beam frame, carport, and screens",
  },
  {
    slug: "modern",
    label: "Modern",
    form: "Interlocking geometric boxes",
    roof: "Flat or very low slope",
    openings: "Ribbon and full-height glass",
    porch: "Sheltered inset entry",
    materials: "Stucco, concrete, steel, and glass",
    details: "Deep reveals and cantilevers",
  },
  {
    slug: "modern-farmhouse",
    label: "Modern farmhouse",
    form: "Simple gabled compound",
    roof: "Steep gables with metal accents",
    openings: "Tall, regularly spaced windows",
    porch: "Broad front porch",
    materials: "Board-and-batten and metal",
    details: "Spare brackets and dark frames",
  },
  {
    slug: "prairie",
    label: "Prairie",
    form: "Strong horizontal composition",
    roof: "Low hip with broad eaves",
    openings: "Horizontal window bands",
    porch: "Integrated porch",
    materials: "Brick, stucco, and wood",
    details: "Belt courses and heavy piers",
  },
  {
    slug: "queen-anne",
    label: "Queen Anne",
    form: "Vertical, complex asymmetry",
    roof: "Steep cross-gables and tower",
    openings: "Bay and varied windows",
    porch: "Wraparound porch",
    materials: "Clapboard, shingles, and wood",
    details: "Spindlework, brackets, and patterned surfaces",
  },
  {
    slug: "ranch",
    label: "Ranch",
    form: "Long single-story form",
    roof: "Low hip or cross-gable",
    openings: "Picture and paired windows",
    porch: "Recessed porch",
    materials: "Brick, wood, and stone",
    details: "Attached garage and broad chimney",
  },
  {
    slug: "spanish-colonial",
    label: "Spanish Colonial",
    form: "Courtyard-oriented asymmetry",
    roof: "Low clay-tile gable or hip",
    openings: "Deep arched openings",
    porch: "Arcade or courtyard",
    materials: "Stucco, clay tile, and heavy wood",
    details: "Vigas, ironwork, and thick walls",
  },
  {
    slug: "texas-hill-country",
    label: "Texas Hill Country",
    form: "Low, rambling pavilions",
    roof: "Medium gables with standing-seam metal",
    openings: "Deep-set rectangular windows",
    porch: "Deep shaded porch",
    materials: "Limestone, cedar, and metal",
    details: "Heavy lintels and exposed timber",
  },
  {
    slug: "tudor-revival",
    label: "Tudor Revival",
    form: "Irregular, steep vertical massing",
    roof: "Steep cross-gables",
    openings: "Tall, narrow windows",
    porch: "Recessed arched entry",
    materials: "Brick, stone, and stucco",
    details: "Large chimney and half-timbering",
  },
] as const satisfies readonly ExteriorStyleDefinition[];

export type ExteriorStyleSlug = (typeof exteriorStyleCatalog)[number]["slug"];

const exteriorStyleSlugs: ReadonlySet<string> = new Set(
  exteriorStyleCatalog.map(({ slug }) => slug),
);

export function isExteriorStyleSlug(value: string): value is ExteriorStyleSlug {
  return exteriorStyleSlugs.has(value);
}

export function exteriorStyleImageSrc(slug: ExteriorStyleSlug) {
  return `/images/plan-your-home/exterior-styles/${slug}.webp`;
}
