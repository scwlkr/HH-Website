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
  questionPosition?: number;
  totalQuestions: number;
  scene: ReactNode;
  prompt: ReactNode;
  cameraFrame: SceneCameraFrame;
  onBack: () => SceneStageNavigationResult;
  onNext: () => SceneStageNavigationResult;
  canGoBack?: boolean;
  backLabel?: string;
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
  questionPosition = question.number,
  totalQuestions,
  scene,
  prompt,
  cameraFrame,
  onBack,
  onNext,
  canGoBack = true,
  backLabel = "Back",
  nextLabel = "Next",
  error = null,
  reducedMotion,
}: SceneStageProps) {
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [direction, setDirection] = useState<NavigationDirection>("next");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const promptSheetRef = useRef<HTMLElement>(null);
  const previousQuestionId = useRef(question.id);
  const prefersReducedMotion = usePrefersReducedMotion(reducedMotion);
  const isTransitioning = phase !== "idle";
  const progressLabel = `Question ${questionPosition} of ${totalQuestions}`;
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

  function advanceStagedPrompt() {
    const action = promptSheetRef.current?.querySelector<HTMLButtonElement>(
      "[data-plan-home-staged-advance]:not(:disabled)",
    );
    if (!action) return false;
    action.click();
    return true;
  }

  return (
    <section
      className={styles.stage}
      data-reduced-motion={prefersReducedMotion}
      data-transition-direction={direction}
      data-transition-state={phase}
      data-in-room-exit-ms={EXIT_DURATION_MS}
      data-in-room-enter-ms={ENTER_DURATION_MS}
      data-question-id={question.id}
      aria-busy={isTransitioning}
    >
      <div className={styles.stageRail} data-plan-home-stage-rail>
        <div>
          <p className={styles.zoneLabel} data-plan-home-zone-label>
            {zone.title}
          </p>
        </div>
        <progress
          className={styles.progress}
          aria-label={progressLabel}
          max={totalQuestions}
          value={questionPosition}
        />
      </div>

      <div className={styles.sceneWindow} data-plan-home-context-strip>
        <div
          className={styles.sceneCamera}
          data-camera-key={question.cameraKey}
          style={cameraStyle(cameraFrame)}
          aria-hidden="true"
        >
          {scene}
        </div>
      </div>

      <div className={styles.promptLayer}>
        <section
          ref={promptSheetRef}
          className={styles.promptSheet}
          data-plan-home-prompt-sheet
          aria-labelledby={`${question.id}-heading`}
          aria-describedby={describedBy}
        >
          <div className={styles.promptHeader}>
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

          <div className={styles.promptBody} data-plan-home-prompt-scroll>
            {prompt}
          </div>

          <div className={styles.stageActions} data-plan-home-actions>
            <Button
              className={styles.actionButton}
              variant="secondary"
              onClick={() => navigate("back", onBack)}
              disabled={!canGoBack || isTransitioning}
            >
              {backLabel}
            </Button>
            <Button
              className={styles.actionButton}
              onClick={() => {
                if (advanceStagedPrompt()) return;
                void navigate("next", onNext);
              }}
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
