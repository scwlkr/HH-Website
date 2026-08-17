"use client";

import { useActionState } from "react";

import { InquiryPrivacyNotice } from "@/components/inquiry/inquiry-privacy-notice";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generalInquiryProjectTypeOptions } from "@/lib/inquiry/options";
import {
  inquiryActionInitialState,
  type GeneralInquiryFormValues,
  type InquiryActionState,
} from "@/types/inquiry";

type SubmitGeneralInquiryAction = (
  state: InquiryActionState,
  formData: FormData,
) => Promise<InquiryActionState>;

export function GeneralInquiryForm({
  initialValues,
  submitAction,
}: Readonly<{
  initialValues: GeneralInquiryFormValues;
  submitAction: SubmitGeneralInquiryAction;
}>) {
  const [state, formAction, pending] = useActionState(
    submitAction,
    inquiryActionInitialState,
  );
  const displayedValues = state.values ?? initialValues;

  return (
    <CardShell className="px-5 py-5 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
      <form
        key={state.attempt}
        action={formAction}
        aria-label="General project inquiry"
        noValidate
      >
        <input type="hidden" name="sourcePage" value={displayedValues.sourcePage} />
        <input type="hidden" name="utmSource" value={displayedValues.utmSource} />
        <input type="hidden" name="utmMedium" value={displayedValues.utmMedium} />
        <input type="hidden" name="utmCampaign" value={displayedValues.utmCampaign} />
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

        {state.message ? (
          <p
            className="mb-6 rounded-[var(--hh-radius-input)] border border-accent bg-accent-soft/50 px-4 py-3 text-sm leading-6 text-foreground"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <Input
            name="name"
            label="Name"
            autoComplete="name"
            defaultValue={displayedValues.name}
            error={state.fieldErrors.name}
            required
          />
          <Select
            name="projectType"
            label="Project type"
            options={generalInquiryProjectTypeOptions}
            placeholder="Choose the closest fit"
            defaultValue={displayedValues.projectType}
            error={state.fieldErrors.projectType}
            required
          />
        </div>

        <fieldset className="mt-5">
          <legend className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted">
            Contact information
          </legend>
          <p id="general-inquiry-contact-help" className="mt-2 text-xs text-muted">
            Share an email address or phone number. One is enough.
          </p>
          <div
            className="mt-3 grid gap-5 md:grid-cols-2"
          >
            <Input
              name="email"
              type="email"
              label="Email"
              autoComplete="email"
              inputMode="email"
              defaultValue={displayedValues.email}
              aria-describedby="general-inquiry-contact-help"
              error={state.fieldErrors.email}
            />
            <Input
              name="phone"
              type="tel"
              label="Phone"
              autoComplete="tel"
              inputMode="tel"
              defaultValue={displayedValues.phone}
              aria-describedby="general-inquiry-contact-help"
              error={state.fieldErrors.phone}
            />
          </div>
        </fieldset>

        <div className="mt-5">
          <Input
            name="projectLocation"
            label="Project location (optional)"
            autoComplete="street-address"
            placeholder="City, county, address, or target area"
            defaultValue={displayedValues.projectLocation}
            error={state.fieldErrors.projectLocation}
          />
        </div>

        <div className="mt-5">
          <Textarea
            name="projectDescription"
            label="What are you planning?"
            placeholder="A short description is enough."
            defaultValue={displayedValues.projectDescription}
            error={state.fieldErrors.projectDescription}
            required
          />
        </div>

        <div className="mt-7 border-t border-line pt-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <InquiryPrivacyNotice />
          <Button
            className="mt-5 shrink-0 sm:mt-0"
            type="submit"
            disabled={pending}
          >
            {pending ? "Sending Inquiry..." : "Send Inquiry"}
          </Button>
        </div>
      </form>
    </CardShell>
  );
}
