import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { exteriorStyleCatalog } from "@/features/plan-your-home/exterior-style-catalog";
import { ExteriorStyleSketch } from "@/features/plan-your-home/exterior-style-sketches";
import { isLoopbackPlanHomeRefinementRequest } from "@/features/plan-your-home/refinement-fixture";
import styles from "./style-review.module.css";

export const metadata: Metadata = {
  title: "Exterior elevation review | Howeth and Harp",
  robots: { index: false, follow: false },
};

export default async function ExteriorStyleReviewPage() {
  const requestHeaders = await headers();
  if (
    !isLoopbackPlanHomeRefinementRequest({
      enabled: process.env.PLAN_HOME_REFINEMENT_MODE === "1",
      environment: process.env.NODE_ENV,
      host: requestHeaders.get("host") ?? "",
    })
  ) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Issue 43 · owner review sheet</p>
        <h1>Exterior elevation styles</h1>
        <p className={styles.intro}>
          Eighteen straight-on architectural archetypes for Plan Your Home. Each
          fictional sketch must communicate its approved form, roof, openings,
          porch, materials, and signature details without depicting a promised
          customer design.
        </p>
      </header>

      <section className={styles.grid} aria-label="Exterior elevation proposals">
        {exteriorStyleCatalog.map((style) => (
          <article className={styles.card} key={style.slug}>
            <div className={styles.art}>
              <ExteriorStyleSketch slug={style.slug} />
            </div>
            <div className={styles.content}>
              <p className={styles.kicker}>Exterior elevation</p>
              <h2>{style.label}</h2>
              <dl className={styles.cues}>
                <dt>Form</dt><dd>{style.form}</dd>
                <dt>Roof</dt><dd>{style.roof}</dd>
                <dt>Openings</dt><dd>{style.openings}</dd>
                <dt>Porch</dt><dd>{style.porch}</dd>
                <dt>Materials</dt><dd>{style.materials}</dd>
                <dt>Details</dt><dd>{style.details}</dd>
              </dl>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.method} aria-labelledby="method-title">
        <p className={styles.eyebrow}>Production method evaluation</p>
        <h2 id="method-title">React-rendered inline SVG is approved</h2>
        <div className={styles.methodGrid}>
          <article>
            <h3>Generated or raster imagery</h3>
            <p>Variable architectural fidelity and rendering, difficult edits, and the largest asset cost. Exploration only.</p>
          </article>
          <article>
            <h3>Static SVG assets</h3>
            <p>Crisp and efficient, but duplicates shared framing and material rules across separate files.</p>
          </article>
          <article className={styles.recommended}>
            <h3>React-rendered inline SVG</h3>
            <p>Direct architectural control, consistent materials, phone clarity, decorative accessibility, maintainability, and measurable budget.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
