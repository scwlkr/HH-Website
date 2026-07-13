"use client";

import { useActionState, useRef, useState } from "react";
import { submitInquiryAction } from "@/app/inquire/actions";
import { InquiryProgress } from "@/components/inquiry/inquiry-progress";
import { InquiryReview } from "@/components/inquiry/inquiry-review";
import { InquiryStepper } from "@/components/inquiry/inquiry-stepper";
import { ActionLink } from "@/components/marketing/action-link";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  budgetRangeOptions,
  finishLevelOptions,
  preferredContactMethodOptions,
  projectTypeOptions,
  servicesNeededOptions,
  lotStatusOptions,
  timelineOptions,
} from "@/lib/inquiry/options";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils/cn";
import {
  getInquiryFormValues,
  inquiryStepSchemas,
  mapInquiryFieldErrors,
  validateInquiryValues,
} from "@/lib/validation/inquiry";
import {
  inquiryActionInitialState,
  type InquiryFieldErrors,
  type InquiryFieldName,
  type InquiryFormValues,
} from "@/types/inquiry";
import type { InquiryOption } from "@/lib/inquiry/options";

const stepFields: ReadonlyArray<ReadonlyArray<InquiryFieldName>> = [
  ["name", "phone", "email", "preferredContactMethod"],
  ["projectType", "approxSquareFootage", "finishLevel", "servicesNeeded"],
  ["projectLocation", "lotStatus", "timeline", "budgetRange"],
  ["projectDescription"],
  [],
];

function getStepIndexForErrors(fieldErrors: InquiryFieldErrors) {
  const fieldNames = Object.keys(fieldErrors) as InquiryFieldName[];

  if (fieldNames.length === 0) {
    return 0;
  }

  const matchingStepIndex = stepFields.findIndex((fields) =>
    fields.some((fieldName) => fieldNames.includes(fieldName)),
  );

  return matchingStepIndex === -1 ? 0 : matchingStepIndex;
}

function toSelectOptions<TValue extends string>(
  options: ReadonlyArray<InquiryOption<TValue>>,
) {
  return options.map((option) => ({
    value: option.value,
    label: option.label,
  }));
}

function getSameOriginReferrerPath() {
  if (typeof window === "undefined" || !document.referrer) {
    return "";
  }

  try {
    const referrerUrl = new URL(document.referrer);

    if (referrerUrl.origin !== window.location.origin) {
      return "";
    }

    return `${referrerUrl.pathname}${referrerUrl.search}`.slice(0, 200);
  } catch {
    return "";
  }
}

function ChoiceGrid<TValue extends string>({
  label,
  helperText,
  error,
  name,
  options,
  type,
  defaultValue,
  defaultValues,
}: {
  label: string;
  helperText?: string;
  error?: string;
  name: string;
  options: ReadonlyArray<InquiryOption<TValue>>;
  type: "radio" | "checkbox";
  defaultValue?: TValue | "";
  defaultValues?: TValue[];
}) {
  const describedById = error
    ? `${name}-error`
    : helperText
      ? `${name}-help`
      : undefined;

  return (
    <fieldset aria-describedby={describedById} aria-invalid={Boolean(error)}>
      <legend className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted">
        {label}
      </legend>
      <div
        className={cn(
          "mt-3 grid gap-3",
          type === "radio" ? "md:grid-cols-3" : "md:grid-cols-2",
        )}
      >
        {options.map((option) => {
          const isCheckedByDefault =
            type === "radio"
              ? option.value === defaultValue
              : (defaultValues ?? []).includes(option.value);

          return (
            <label key={option.value} className="group cursor-pointer">
              <input
                className="peer sr-only"
                type={type}
                name={name}
                value={option.value}
                defaultChecked={isCheckedByDefault}
              />
              <span className="block rounded-[calc(var(--hh-radius-panel)-0.3rem)] border border-line-strong bg-surface-raised px-4 py-4 transition-colors peer-checked:border-accent peer-checked:bg-accent-soft/40 peer-focus-visible:border-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent-soft group-hover:border-accent">
                <span className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-foreground">
                  {option.label}
                </span>
                {option.description ? (
                  <span className="mt-2 block text-sm leading-6 text-muted">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={describedById} className="mt-2 text-xs text-accent-strong">
          {error}
        </p>
      ) : helperText ? (
        <p id={describedById} className="mt-2 text-xs text-muted">
          {helperText}
        </p>
      ) : null}
    </fieldset>
  );
}

type InquiryFormProps = {
  initialValues: InquiryFormValues;
};

export function InquiryForm({ initialValues }: InquiryFormProps) {
  const [state, formAction, pending] = useActionState(
    submitInquiryAction,
    inquiryActionInitialState,
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [clientErrors, setClientErrors] = useState<InquiryFieldErrors>({});
  const [draftValues, setDraftValues] = useState(initialValues);
  const formRef = useRef<HTMLFormElement>(null);
  const lastStepIndex = stepFields.length - 1;
  const sourcePage = initialValues.sourcePage || getSameOriginReferrerPath();
  const activeStepIndex =
    state.status === "field-error"
      ? getStepIndexForErrors(state.fieldErrors)
      : currentStepIndex;

  function syncDraftValues() {
    if (!formRef.current) {
      return;
    }

    const nextValues = getInquiryFormValues(new FormData(formRef.current));

    setDraftValues(nextValues);
  }

  function validateStep(stepIndex: number) {
    if (!formRef.current) {
      return true;
    }

    const values = getInquiryFormValues(new FormData(formRef.current));
    const schema =
      stepIndex === 0
        ? inquiryStepSchemas.contact
        : stepIndex === 1
          ? inquiryStepSchemas.projectBasics
          : stepIndex === 2
            ? inquiryStepSchemas.siteContext
            : inquiryStepSchemas.description;

    const validationResult = schema.safeParse(values);

    if (validationResult.success) {
      setClientErrors({});
      return true;
    }

    setClientErrors(mapInquiryFieldErrors(validationResult.error));
    return false;
  }

  function handleNextStep() {
    syncDraftValues();

    if (!validateStep(activeStepIndex)) {
      return;
    }

    setCurrentStepIndex((previousStep) =>
      Math.min(previousStep + 1, lastStepIndex),
    );
  }

  function handlePreviousStep() {
    setClientErrors({});
    setCurrentStepIndex((previousStep) => Math.max(previousStep - 1, 0));
  }

  const displayFieldErrors = {
    ...state.fieldErrors,
    ...clientErrors,
  };

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-10">
      <CardShell className="px-5 py-5 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
        <form
          ref={formRef}
          action={formAction}
          noValidate
          onChange={() => {
            syncDraftValues();
            setClientErrors({});
          }}
          onSubmitCapture={(event) => {
            if (!formRef.current) {
              return;
            }

            const values = getInquiryFormValues(new FormData(formRef.current));
            const validationResult = validateInquiryValues(values);

            if (validationResult.success) {
              setClientErrors({});
              return;
            }

            event.preventDefault();

            const nextFieldErrors = mapInquiryFieldErrors(validationResult.error);
            setClientErrors(nextFieldErrors);
            setCurrentStepIndex(getStepIndexForErrors(nextFieldErrors));
          }}
        >
          <input
            type="hidden"
            name="sourcePage"
            value={sourcePage}
            readOnly
            aria-hidden="true"
            suppressHydrationWarning
          />
          <input
            type="hidden"
            name="utmSource"
            value={initialValues.utmSource}
            readOnly
            aria-hidden="true"
          />
          <input
            type="hidden"
            name="utmMedium"
            value={initialValues.utmMedium}
            readOnly
            aria-hidden="true"
          />
          <input
            type="hidden"
            name="utmCampaign"
            value={initialValues.utmCampaign}
            readOnly
            aria-hidden="true"
          />
          <div
            className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
            aria-hidden="true"
          >
            <label htmlFor="company">
              Company
              <input
                id="company"
                name="company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                defaultValue=""
              />
            </label>
          </div>

          <InquiryStepper currentStepIndex={activeStepIndex} />

          {state.message ? (
            <div
              className={cn(
                "mt-6 rounded-[calc(var(--hh-radius-panel)-0.3rem)] border px-4 py-4 text-sm leading-6",
                state.status === "server-error"
                  ? "border-accent bg-accent-soft/50 text-foreground"
                  : "border-line-strong bg-surface-raised text-muted",
              )}
              role="alert"
            >
              {state.message}
            </div>
          ) : null}

          <div className="mt-8 space-y-8">
            <fieldset hidden={activeStepIndex !== 0} aria-hidden={activeStepIndex !== 0}>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  name="name"
                  label="Name"
                  placeholder="Full name"
                  defaultValue={initialValues.name}
                  error={displayFieldErrors.name}
                  helperText={`The primary person ${siteConfig.shortName} should respond to.`}
                />
                <Input
                  name="phone"
                  label="Phone"
                  placeholder="(555) 555-5555"
                  defaultValue={initialValues.phone}
                  error={displayFieldErrors.phone}
                  helperText="A direct number is best for project follow-up."
                  inputMode="tel"
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                <Input
                  name="email"
                  type="email"
                  label="Email"
                  placeholder="you@example.com"
                  defaultValue={initialValues.email}
                  error={displayFieldErrors.email}
                  helperText="Used for the written recap or scheduling follow-up."
                />
                <ChoiceGrid
                  type="radio"
                  name="preferredContactMethod"
                  label="Preferred Contact Method"
                  options={preferredContactMethodOptions}
                  defaultValue={initialValues.preferredContactMethod}
                  error={displayFieldErrors.preferredContactMethod}
                />
              </div>
            </fieldset>

            <fieldset hidden={activeStepIndex !== 1} aria-hidden={activeStepIndex !== 1}>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,0.75fr)]">
                <Select
                  name="projectType"
                  label="Project Type"
                  options={toSelectOptions(projectTypeOptions)}
                  placeholder="Select a project category"
                  defaultValue={initialValues.projectType}
                  error={displayFieldErrors.projectType}
                  helperText="Choose the category that is closest, even if it is not final yet."
                />
                <Input
                  name="approxSquareFootage"
                  label="Approximate Square Footage"
                  placeholder="2,400"
                  defaultValue={initialValues.approxSquareFootage}
                  error={displayFieldErrors.approxSquareFootage}
                  helperText="A rough estimate is enough for first-pass planning."
                  inputMode="numeric"
                />
              </div>

              <div className="mt-4">
                <Select
                  name="finishLevel"
                  label="Finish Direction"
                  options={toSelectOptions(finishLevelOptions)}
                  placeholder="Select a finish level"
                  defaultValue={initialValues.finishLevel}
                  error={displayFieldErrors.finishLevel}
                  helperText="This can stay directional. “Not Sure Yet” is a valid answer."
                />
              </div>

              <div className="mt-4">
                <ChoiceGrid
                  type="checkbox"
                  name="servicesNeeded"
                  label="Services Needed"
                  options={servicesNeededOptions}
                  defaultValues={initialValues.servicesNeeded}
                  error={displayFieldErrors.servicesNeeded}
                  helperText={`Select the work ${siteConfig.shortName} should expect to discuss.`}
                />
              </div>
            </fieldset>

            <fieldset hidden={activeStepIndex !== 2} aria-hidden={activeStepIndex !== 2}>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  name="projectLocation"
                  label="Project Location"
                  placeholder="City, neighborhood, or target area"
                  defaultValue={initialValues.projectLocation}
                  error={displayFieldErrors.projectLocation}
                  helperText="A city or target area is enough for the initial brief."
                />
                <Select
                  name="lotStatus"
                  label="Lot Status"
                  options={toSelectOptions(lotStatusOptions)}
                  placeholder="Select lot status"
                  defaultValue={initialValues.lotStatus}
                  error={displayFieldErrors.lotStatus}
                  helperText={`This helps ${siteConfig.shortName} understand how settled the site context is.`}
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Select
                  name="timeline"
                  label="Target Timeline"
                  options={toSelectOptions(timelineOptions)}
                  placeholder="Select a target timeline"
                  defaultValue={initialValues.timeline}
                  error={displayFieldErrors.timeline}
                  helperText="Choose the closest current timing, even if it may shift."
                />
                <Select
                  name="budgetRange"
                  label="Budget Range"
                  options={toSelectOptions(budgetRangeOptions)}
                  placeholder="Optional"
                  defaultValue={initialValues.budgetRange}
                  error={displayFieldErrors.budgetRange}
                  helperText="Optional, but useful if the investment range is already clear."
                />
              </div>
            </fieldset>

            <fieldset hidden={activeStepIndex !== 3} aria-hidden={activeStepIndex !== 3}>
              <Textarea
                name="projectDescription"
                label="Project Description And Priorities"
                placeholder="Share the project goals, the kind of work you expect, any known constraints, and what matters most right now."
                defaultValue={initialValues.projectDescription}
                error={displayFieldErrors.projectDescription}
                helperText={`A short, direct description is enough. ${siteConfig.shortName} mainly needs the scope and priorities in your own words.`}
              />
            </fieldset>

            <fieldset hidden={activeStepIndex !== 4} aria-hidden={activeStepIndex !== 4}>
              <p className="max-w-2xl text-sm leading-7 text-muted">
                Review the brief below. If something needs adjustment, step back and
                update it before sending.
              </p>
              <div className="mt-6">
                <InquiryReview values={draftValues} />
              </div>
            </fieldset>
          </div>

          <div className="mt-8 border-t border-line pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-muted">
                Rough answers are welcome—you can refine the details with h and h later.
              </p>
              <div className="flex flex-wrap gap-3">
                {activeStepIndex > 0 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handlePreviousStep}
                    disabled={pending}
                  >
                    Back
                  </Button>
                ) : null}

                {activeStepIndex < lastStepIndex ? (
                  <Button type="button" onClick={handleNextStep}>
                    Continue
                  </Button>
                ) : (
                  <Button type="submit" disabled={pending}>
                    {pending ? "Sending Brief..." : "Send Project Brief"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </CardShell>

      <aside className="space-y-8 xl:sticky xl:top-28">
        <InquiryProgress currentStepIndex={activeStepIndex} />

        <div className="border-t border-line-strong pt-6">
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
            What Happens Next
          </p>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-muted">
            <li className="border-b border-line pb-3">
              {siteConfig.shortName} reviews your project type, finish direction,
              location, and timing before reaching out.
            </li>
            <li className="border-b border-line pb-3">
              The first follow-up uses the contact method selected in the brief.
            </li>
            <li>
              For urgent updates, email {siteConfig.shortName} directly.
            </li>
          </ul>
          <a
            href={siteConfig.contact.email.href}
            className="hh-link mt-5 inline-flex text-sm text-foreground"
          >
            {siteConfig.contact.email.label}
          </a>
          <div className="mt-5">
            <ActionLink
              href="/pricing"
              label="Review Finish Levels"
              variant="secondary"
              trackingLocation="inquiry-side-panel"
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
