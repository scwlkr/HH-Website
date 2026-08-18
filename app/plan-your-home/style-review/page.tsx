import type { Metadata } from "next";
import Image from "next/image";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  exteriorStyleCatalog,
  exteriorStyleImageSrc,
} from "@/features/plan-your-home/exterior-style-catalog";
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
          fictional illustration must communicate its approved form, roof, openings,
          porch, materials, and signature details without depicting a promised
          customer design.
        </p>
      </header>

      <section className={styles.grid} aria-label="Exterior elevation proposals">
        {exteriorStyleCatalog.map((style) => (
          <article className={styles.card} key={style.slug}>
            <div className={styles.art}>
              <Image
                alt=""
                className={styles.image}
                height={512}
                loading="eager"
                src={exteriorStyleImageSrc(style.slug)}
                unoptimized
                width={768}
              />
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
        <h2 id="method-title">Curated generated static imagery is approved</h2>
        <div className={styles.methodGrid}>
          <article>
            <h3>React-rendered inline SVG</h3>
            <p>Rejected after review because construction strokes read as disconnected debris and weakened architectural credibility.</p>
          </article>
          <article>
            <h3>Hand-authored static SVG</h3>
            <p>Potentially crisp, but eighteen detailed elevations would be costly to author and difficult to keep equally resolved.</p>
          </article>
          <article className={styles.recommended}>
            <h3>Curated generated WebP</h3>
            <p>Approved visual fidelity and distinction, locked 3:2 framing, reusable prompts, decorative accessibility, and a 588 KB asset set.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
