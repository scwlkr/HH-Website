"use client";

import { useActionState } from "react";
import { savePricingSettingsAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  pricingActionInitialState,
  type PricingSettings,
} from "@/types/operations";

type AdminPricingFormProps = {
  pricingSettings: PricingSettings;
};

export function AdminPricingForm({ pricingSettings }: AdminPricingFormProps) {
  const [state, formAction, pending] = useActionState(
    savePricingSettingsAction,
    pricingActionInitialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-3">
        <Input
          name="builderGradePricePerSqft"
          label="Builder Grade"
          defaultValue={pricingSettings.builderGradePricePerSqft?.toString() ?? ""}
          className="rounded-[var(--hh-radius-tight)]"
          helperText="Dollar benchmark per square foot."
          error={state.fieldErrors.builderGradePricePerSqft}
          required
        />

        <Input
          name="builderPlusPricePerSqft"
          label="Builder+"
          defaultValue={pricingSettings.builderPlusPricePerSqft?.toString() ?? ""}
          className="rounded-[var(--hh-radius-tight)]"
          helperText="Dollar benchmark per square foot."
          error={state.fieldErrors.builderPlusPricePerSqft}
          required
        />

        <Input
          name="customPricePerSqft"
          label="Custom"
          defaultValue={pricingSettings.customPricePerSqft?.toString() ?? ""}
          className="rounded-[var(--hh-radius-tight)]"
          helperText="Dollar benchmark per square foot."
          error={state.fieldErrors.customPricePerSqft}
          required
        />
      </div>

      <Textarea
        name="pricingNote"
        label="Pricing Note"
        defaultValue={pricingSettings.pricingNote ?? ""}
        className="rounded-[var(--hh-radius-tight)]"
        helperText="Directional disclaimer shown on the public pricing pages."
        error={state.fieldErrors.pricingNote}
      />

      {state.message ? (
        <p className="text-sm text-accent-strong">{state.message}</p>
      ) : null}

      <Button
        type="submit"
        className="rounded-[var(--hh-radius-tight)]"
        disabled={pending}
      >
        {pending ? "Saving..." : "Save Pricing"}
      </Button>
    </form>
  );
}
