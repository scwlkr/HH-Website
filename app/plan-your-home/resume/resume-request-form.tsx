"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  requestPlanHomeResumeAction,
  type PlanHomeResumeRequestState,
} from "@/app/plan-your-home/resume/actions";

import styles from "./resume.module.css";

export function ResumeRequestForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    requestPlanHomeResumeAction,
    { submitted: false, message: "" } satisfies PlanHomeResumeRequestState,
  );
  useEffect(() => {
    if (state.submitted) formRef.current?.reset();
  }, [state.submitted]);

  return (
    <form ref={formRef} action={action} className={styles.form}>
      <label htmlFor="plan-home-resume-email">Email used to save your plan</label>
      <input
        id="plan-home-resume-email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        maxLength={160}
        aria-describedby="plan-home-resume-help"
      />
      <p id="plan-home-resume-help">
        We send a link only when you ask. H and H does not send automatic
        abandoned-plan reminders.
      </p>
      <Button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "Checking saved plans…" : "Email my resume link"}
      </Button>
      <p
        className={styles.result}
        role="status"
        aria-live="polite"
        hidden={!state.submitted}
      >
        {state.message}
      </p>
    </form>
  );
}
