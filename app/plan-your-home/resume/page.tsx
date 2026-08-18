import type { Metadata } from "next";
import Link from "next/link";

import { ResumeRequestForm } from "./resume-request-form";
import { ResumeTokenConsumer } from "./resume-token-consumer";
import styles from "./resume.module.css";
import { readPlanHomeDraftBoundary } from "@/lib/db/plan-home-drafts";
import { getPlanHomeDraftSession } from "@/lib/plan-your-home/draft-session";

export const metadata: Metadata = {
  title: "Resume Plan Your Home",
  description: "Request a secure link to resume a saved Plan Your Home brief.",
  robots: { index: false, follow: false },
};

export default async function PlanHomeResumePage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ status?: string }>;
}>) {
  const status = (await searchParams).status;
  const session = status === "restored" ? await getPlanHomeDraftSession() : null;
  let restored = false;
  if (session) {
    try {
      await readPlanHomeDraftBoundary(session.draftId, session.sessionTokenHash);
      restored = true;
    } catch {
      restored = false;
    }
  }
  const unavailable = status === "unavailable" || (status === "restored" && !restored);

  return (
    <main className={styles.page}>
      <ResumeTokenConsumer />
      <div className={styles.header}>
        <p>Plan Your Home</p>
        <span>Secure draft return</span>
      </div>
      <section className={styles.sheet} aria-labelledby="resume-title">
        <div className={styles.planMarks} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>
            {restored ? "Draft verified" : "Saved project brief"}
          </p>
          <h1 id="resume-title">
            {restored
              ? "Your saved boundary is ready."
              : "Pick up the plan where the last room was saved."}
          </h1>
          {restored ? (
            <>
              <p className={styles.intro}>
                This browser now has a private draft session. Continue at the
                last server-synced room boundary; your one-time email link has
                already been retired.
              </p>
              <Link className={styles.continueLink} href="/plan-your-home">
                Continue Plan Your Home
              </Link>
            </>
          ) : (
            <>
              <p className={styles.intro}>
                Enter the email you used at the save-progress checkpoint. For
                privacy, the result is the same whether or not a matching draft
                exists.
              </p>
              <p className={styles.privacyNote}>
                Before you enter an email: H and H uses it only to send the
                one-time resume link you request, never an automatic abandoned-
                plan reminder. Read the{" "}
                <Link className="hh-touch-target" href="/privacy">
                  privacy policy
                </Link>{"."}
              </p>
              {unavailable ? (
                <p className={styles.notice} role="status">
                  That one-time link is unavailable. Request a new link below;
                  expired, used, and invalid links all receive this same result.
                </p>
              ) : null}
              <ResumeRequestForm />
            </>
          )}
        </div>
        <aside className={styles.securityNote} aria-label="Resume link details">
          <span className={styles.stamp}>15 min</span>
          <p>One use</p>
          <p>No account</p>
          <p>Requested email only</p>
        </aside>
      </section>
      <Link className={styles.backLink} href="/plan-your-home">
        Back to Plan Your Home
      </Link>
    </main>
  );
}
