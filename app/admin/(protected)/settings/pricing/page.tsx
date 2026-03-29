import type { Metadata } from "next";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminPricingForm } from "@/components/admin/admin-pricing-form";
import { formatAdminPageTitle } from "@/lib/admin/branding";
import { getAdminPricingSettings } from "@/lib/db/operations";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: formatAdminPageTitle("Pricing Settings"),
  description: "Manage square-foot pricing benchmarks in HHQ, the Howeth and Harp admin workspace.",
  path: "/admin/settings/pricing",
  noIndex: true,
});

type PricingSettingsPageProps = {
  searchParams: Promise<{
    saved?: string;
  }>;
};

export default async function PricingSettingsPage({
  searchParams,
}: PricingSettingsPageProps) {
  const { saved } = await searchParams;
  const pricingSettings = await getAdminPricingSettings();

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
          HHQ Pricing
        </p>
        <h1 className="mt-3 text-4xl">Square-Foot Pricing</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted">
          Update the shared public pricing benchmarks and the note that appears on the
          pricing pages.
        </p>
      </div>

      {saved ? (
        <AdminNotice tone="success">Pricing settings were saved.</AdminNotice>
      ) : null}

      <div className="hh-admin-panel rounded-[var(--hh-radius-panel)] p-5 sm:p-6">
        <AdminPricingForm pricingSettings={pricingSettings} />
      </div>
    </div>
  );
}
