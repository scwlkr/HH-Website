"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import type {
  PlanHomeQuestionDefinition,
  PlanHomeZoneDefinition,
} from "@/features/plan-your-home/registry";
import type { PlanHomeTourTransition } from "@/features/plan-your-home/tour-state";

import styles from "./scene-stage.module.css";

export type SceneCameraFrame = Readonly<{
  xPercent: number;
  yPercent: number;
  scale: number;
}>;

export type SceneStageNavigationResult = boolean | Promise<boolean>;

type SceneStageProps = Readonly<{
  question: PlanHomeQuestionDefinition;
  zone: PlanHomeZoneDefinition;
  totalQuestions: number;
  scene: ReactNode;
  prompt: ReactNode;
  cameraFrame: SceneCameraFrame;
  onBack: () => SceneStageNavigationResult;
  onNext: () => SceneStageNavigationResult;
  canGoBack?: boolean;
  nextLabel?: string;
  error?: PlanHomeTourTransition["error"];
  reducedMotion?: boolean;
}>;

type TransitionPhase = "idle" | "exiting" | "entering";
type NavigationDirection = "back" | "next";

const EXIT_DURATION_MS = 120;
const ENTER_DURATION_MS = 180;

function usePrefersReducedMotion(override?: boolean) {
  const [mediaPreference, setMediaPreference] = useState(() =>
    override === undefined && typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    if (override !== undefined || typeof window === "undefined") {
      return;
    }

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMediaPreference(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [override]);

  return override ?? mediaPreference;
}

function cameraStyle(frame: SceneCameraFrame) {
  return {
    "--scene-camera-x": `${frame.xPercent}%`,
    "--scene-camera-y": `${frame.yPercent}%`,
    "--scene-camera-scale": frame.scale,
  } as CSSProperties;
}

export function SceneStage({
  question,
  zone,
  totalQuestions,
  scene,
  prompt,
  cameraFrame,
  onBack,
  onNext,
  canGoBack = true,
  nextLabel = "Next",
  error = null,
  reducedMotion,
}: SceneStageProps) {
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [direction, setDirection] = useState<NavigationDirection>("next");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousQuestionId = useRef(question.id);
  const prefersReducedMotion = usePrefersReducedMotion(reducedMotion);
  const isTransitioning = phase !== "idle";
  const progressLabel = `Question ${question.number} of ${totalQuestions}`;
  const helperId = question.helper ? `${question.id}-instructions` : undefined;
  const errorId = error ? `${question.id}-stage-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (previousQuestionId.current === question.id) {
      return;
    }

    previousQuestionId.current = question.id;
    headingRef.current?.focus({ preventScroll: true });
  }, [progressLabel, question.id, zone.title]);

  useEffect(() => {
    if (phase !== "entering" || prefersReducedMotion) {
      return;
    }

    const timer = window.setTimeout(() => setPhase("idle"), ENTER_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [phase, prefersReducedMotion]);

  async function navigate(
    nextDirection: NavigationDirection,
    callback: () => SceneStageNavigationResult,
  ) {
    if (isTransitioning) {
      return;
    }

    setDirection(nextDirection);

    if (prefersReducedMotion) {
      await callback();
      setPhase("idle");
      return;
    }

    setPhase("exiting");
    window.setTimeout(async () => {
      const moved = await callback();
      setPhase(moved ? "entering" : "idle");
    }, EXIT_DURATION_MS);
  }

  return (
    <section
      className={styles.stage}
      data-transition-direction={direction}
      data-transition-state={phase}
      aria-busy={isTransitioning}
    >
      <div className={styles.stageRail}>
        <div>
          <p className={styles.zoneLabel}>{zone.title}</p>
          <p className={styles.progressLabel}>{progressLabel}</p>
        </div>
        <progress
          className={styles.progress}
          aria-label={progressLabel}
          max={totalQuestions}
          value={question.number}
        />
      </div>

      <div className={styles.sceneWindow}>
        <div
          className={styles.sceneCamera}
          data-camera-key={question.cameraKey}
          style={cameraStyle(cameraFrame)}
          aria-hidden="true"
        >
          {scene}
        </div>
        <div className={styles.cameraMark} aria-hidden="true">
          <span>{question.sceneAnchor.replaceAll("-", " ")}</span>
        </div>
      </div>

      <div className={styles.promptLayer}>
        <section
          className={styles.promptSheet}
          aria-labelledby={`${question.id}-heading`}
          aria-describedby={describedBy}
        >
          <div className={styles.promptHeader}>
            <span className={styles.questionNumber} aria-hidden="true">
              {String(question.number).padStart(2, "0")}
            </span>
            <div>
              <h1
                ref={headingRef}
                id={`${question.id}-heading`}
                className={styles.promptHeading}
                tabIndex={-1}
              >
                {question.prompt}
              </h1>
              {question.helper ? (
                <p id={helperId} className={styles.promptHelper}>
                  {question.helper}
                </p>
              ) : null}
            </div>
          </div>

          {error ? (
            <p id={errorId} className={styles.stageError} role="alert">
              <span aria-hidden="true">Check this answer</span>
              {error.message}
            </p>
          ) : null}

          <div className={styles.promptBody}>{prompt}</div>

          <div className={styles.stageActions}>
            <Button
              className={styles.actionButton}
              variant="secondary"
              onClick={() => navigate("back", onBack)}
              disabled={!canGoBack || isTransitioning}
            >
              Back
            </Button>
            <Button
              className={styles.actionButton}
              onClick={() => navigate("next", onNext)}
              disabled={isTransitioning}
            >
              {nextLabel}
            </Button>
          </div>
        </section>
      </div>

      <p className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {zone.title}. {progressLabel}.
      </p>
    </section>
  );
}
