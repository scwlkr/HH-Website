import { AdminNotice } from "@/components/admin/admin-notice";
import { buttonVariants } from "@/components/ui/button";
import type {
  AdminInquiryQueueItem,
  AdminInquiryStatus,
  AdminInquiryStatusFilter,
} from "@/features/plan-your-home/admin-inquiry-queue";
import { cn } from "@/lib/utils/cn";

const statusPresentation: Record<
  AdminInquiryStatus,
  Readonly<{ label: string; className: string }>
> = {
  draft: {
    label: "Draft",
    className: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  },
  submitted: {
    label: "Submitted",
    className: "border-sky-300/30 bg-sky-300/10 text-sky-100",
  },
  reviewed: {
    label: "Reviewed",
    className: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  },
  spam: {
    label: "Spam",
    className: "border-rose-300/30 bg-rose-300/10 text-rose-100",
  },
};

const filterOptions: readonly Readonly<{
  value: AdminInquiryStatusFilter;
  label: string;
}>[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "reviewed", label: "Reviewed" },
  { value: "spam", label: "Spam" },
];

function formatLastActivity(value: string | null) {
  if (!value) return "Activity unavailable";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
    timeZoneName: "short",
  }).format(new Date(value));
}

function QueueField({
  label,
  children,
  className,
}: Readonly<{
  label: string;
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <div className={className}>
      <p className="mb-1 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted xl:hidden">
        {label}
      </p>
      {children}
    </div>
  );
}

function InquiryRow({ inquiry }: Readonly<{ inquiry: AdminInquiryQueueItem }>) {
  const status = statusPresentation[inquiry.status];

  return (
    <li className="grid gap-5 border-b border-line px-4 py-5 last:border-b-0 xl:grid-cols-[minmax(10rem,1.25fr)_minmax(10rem,1.25fr)_minmax(7.5rem,0.75fr)_minmax(11rem,1.3fr)_minmax(9rem,0.9fr)_minmax(9rem,0.9fr)] xl:items-center xl:gap-4 xl:py-4">
      <QueueField label="Inquiry">
        <p className="font-medium text-foreground">{inquiry.name}</p>
        <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted">
          {inquiry.source === "legacy" ? "Legacy inquiry" : "Plan Your Home"}
        </p>
      </QueueField>

      <QueueField label="Contact">
        <div className="space-y-1 text-sm text-muted-strong">
          <p className="break-all">{inquiry.email ?? "No email"}</p>
          <p>{inquiry.phone ?? "No phone"}</p>
        </div>
      </QueueField>

      <QueueField label="Status">
        <span
          className={cn(
            "inline-flex min-h-7 items-center rounded-[var(--hh-radius-tight)] border px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.14em]",
            status.className,
          )}
        >
          {status.label}
        </span>
      </QueueField>

      <QueueField label="Progress">
        <p className="text-sm leading-6 text-muted-strong">{inquiry.progress}</p>
      </QueueField>

      <QueueField label="Last activity">
        {inquiry.lastActivityAt ? (
          <time
            dateTime={inquiry.lastActivityAt}
            className="text-sm leading-6 text-muted-strong"
          >
            {formatLastActivity(inquiry.lastActivityAt)}
          </time>
        ) : (
          <p className="text-sm leading-6 text-muted">Activity unavailable</p>
        )}
      </QueueField>

      <QueueField label="Location">
        <p className="text-sm leading-6 text-muted-strong">
          {inquiry.location ?? "Not provided"}
        </p>
      </QueueField>
    </li>
  );
}

export function AdminInquiryQueue({
  inquiries,
  statusFilter,
  errorMessage,
}: Readonly<{
  inquiries: readonly AdminInquiryQueueItem[];
  statusFilter: AdminInquiryStatusFilter;
  errorMessage?: string;
}>) {
  const filterLabel = filterOptions.find(
    ({ value }) => value === statusFilter,
  )?.label;

  return (
    <div className="space-y-5">
      <div className="hh-admin-panel rounded-[var(--hh-radius-panel)] p-4 sm:p-5">
        <form
          method="get"
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="w-full max-w-sm">
            <label
              htmlFor="inquiry-status-filter"
              className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-strong"
            >
              Status
            </label>
            <select
              id="inquiry-status-filter"
              name="status"
              defaultValue={statusFilter}
              className="mt-2 min-h-11 w-full rounded-[var(--hh-radius-tight)] border border-line-strong bg-background/70 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 min-[420px]:flex-row">
            <button
              type="submit"
              className={cn(
                buttonVariants(),
                "hh-admin-button rounded-[var(--hh-radius-tight)]",
              )}
            >
              Apply Filter
            </button>
            {statusFilter !== "all" ? (
              <a
                href="/admin/inquiries"
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "hh-admin-button hh-admin-button-secondary rounded-[var(--hh-radius-tight)]",
                )}
              >
                Clear
              </a>
            ) : null}
          </div>
        </form>
      </div>

      {errorMessage ? (
        <AdminNotice tone="error">{errorMessage}</AdminNotice>
      ) : (
        <section
          className="hh-admin-panel overflow-hidden rounded-[var(--hh-radius-panel)]"
          aria-labelledby="inquiry-queue-title"
        >
          <div className="flex flex-col gap-2 border-b border-line-strong bg-background/55 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="inquiry-queue-title" className="text-xl">
                {filterLabel ?? "All statuses"}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {inquiries.length} {inquiries.length === 1 ? "inquiry" : "inquiries"}
              </p>
            </div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted">
              Newest activity first
            </p>
          </div>

          {inquiries.length > 0 ? (
            <>
              <div
                aria-hidden="true"
                className="hidden grid-cols-[minmax(10rem,1.25fr)_minmax(10rem,1.25fr)_minmax(7.5rem,0.75fr)_minmax(11rem,1.3fr)_minmax(9rem,0.9fr)_minmax(9rem,0.9fr)] gap-4 border-b border-line-strong px-4 py-3 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted xl:grid"
              >
                <span>Inquiry</span>
                <span>Contact</span>
                <span>Status</span>
                <span>Progress</span>
                <span>Last activity</span>
                <span>Location</span>
              </div>
              <ul aria-label="Inquiries">
                {inquiries.map((inquiry) => (
                  <InquiryRow key={inquiry.id} inquiry={inquiry} />
                ))}
              </ul>
            </>
          ) : (
            <div className="px-5 py-12 text-center">
              <p className="text-lg text-foreground">No inquiries found.</p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">
                {statusFilter === "all"
                  ? "New project inquiries will appear here after they are saved."
                  : `No ${filterLabel?.toLocaleLowerCase("en-US")} inquiries match this filter.`}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
