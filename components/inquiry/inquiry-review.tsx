import { CardShell } from "@/components/ui/card-shell";
import {
  getBudgetRangeLabel,
  getFinishLevelLabel,
  getLotStatusLabel,
  getPreferredContactMethodLabel,
  getProjectTypeLabel,
  getServiceNeededLabel,
  getTimelineLabel,
} from "@/lib/inquiry/options";
import type { InquiryFormValues } from "@/types/inquiry";

type InquiryReviewProps = {
  values: InquiryFormValues;
};

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="border-b border-line py-3 first:pt-0 last:border-b-0 last:pb-0">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-sm leading-7 text-foreground">
        {value && value.length > 0 ? value : "Not provided"}
      </p>
    </div>
  );
}

function formatSquareFootage(value: string) {
  const digitsOnly = value.replace(/[^\d]/g, "");

  if (!digitsOnly) {
    return "Not provided";
  }

  const parsedValue = Number.parseInt(digitsOnly, 10);

  if (!Number.isFinite(parsedValue)) {
    return value;
  }

  return `${new Intl.NumberFormat("en-US").format(parsedValue)} sq ft`;
}

export function InquiryReview({ values }: InquiryReviewProps) {
  const serviceLabels = values.servicesNeeded
    .map((value) => getServiceNeededLabel(value))
    .filter((value): value is string => Boolean(value))
    .join(", ");

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <CardShell>
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
          Contact
        </p>
        <div className="mt-5">
          <ReviewRow label="Name" value={values.name} />
          <ReviewRow label="Phone" value={values.phone} />
          <ReviewRow label="Email" value={values.email} />
          <ReviewRow
            label="Preferred Contact"
            value={getPreferredContactMethodLabel(values.preferredContactMethod)}
          />
        </div>
      </CardShell>

      <CardShell>
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
          Project Basics
        </p>
        <div className="mt-5">
          <ReviewRow
            label="Project Type"
            value={getProjectTypeLabel(values.projectType)}
          />
          <ReviewRow
            label="Approx. Square Footage"
            value={formatSquareFootage(values.approxSquareFootage)}
          />
          <ReviewRow
            label="Finish Direction"
            value={getFinishLevelLabel(values.finishLevel)}
          />
          <ReviewRow
            label="Services Needed"
            value={serviceLabels || "Not provided"}
          />
        </div>
      </CardShell>

      <CardShell>
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
          Site Context
        </p>
        <div className="mt-5">
          <ReviewRow label="Project Location" value={values.projectLocation} />
          <ReviewRow
            label="Lot Status"
            value={getLotStatusLabel(values.lotStatus)}
          />
          <ReviewRow label="Timeline" value={getTimelineLabel(values.timeline)} />
          <ReviewRow
            label="Budget Range"
            value={getBudgetRangeLabel(values.budgetRange) ?? "Optional"}
          />
        </div>
      </CardShell>

      <CardShell tone="accent">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
          Project Description
        </p>
        <p className="mt-5 text-sm leading-7 text-foreground">
          {values.projectDescription || "Not provided"}
        </p>
      </CardShell>
    </div>
  );
}
