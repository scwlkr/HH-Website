import Link from "next/link";

import type { AdminInquiryActionState } from "@/features/plan-your-home/admin-inquiry-actions";
import { AdminInquiryActions } from "@/components/admin/admin-inquiry-actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { buttonVariants } from "@/components/ui/button";
import type {
  AdminInquiryDetail,
  AdminInquiryDetailStatus,
} from "@/features/plan-your-home/admin-inquiry-detail";
import { cn } from "@/lib/utils/cn";

const statusPresentation: Record<
  AdminInquiryDetailStatus,
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
  deleting: {
    label: "Deletion Pending",
    className: "border-rose-300/30 bg-rose-300/10 text-rose-100",
  },
};

function formatTimestamp(value: string | null) {
  if (!value) return "Unavailable";
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

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function DetailField({
  label,
  children,
}: Readonly<{
  label: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="border-b border-line py-3 first:pt-0 last:border-b-0 last:pb-0">
      <dt className="font-mono text-[0.65rem] uppercase tracking-[0.17em] text-muted">
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm leading-6 text-muted-strong">
        {children}
      </dd>
    </div>
  );
}

function DetailPanel({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="hh-admin-panel rounded-[var(--hh-radius-panel)] p-5 sm:p-6">
      <h2 className="text-xl">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function AdminInquiryDetailView({
  inquiry,
  statusAction,
  deleteAction,
}: Readonly<{
  inquiry: AdminInquiryDetail;
  statusAction: (
    state: AdminInquiryActionState,
    formData: FormData,
  ) => Promise<AdminInquiryActionState>;
  deleteAction: (
    state: AdminInquiryActionState,
    formData: FormData,
  ) => Promise<AdminInquiryActionState>;
}>) {
  const status = statusPresentation[inquiry.status];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/inquiries"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "min-h-11 rounded-[var(--hh-radius-tight)]",
        )}
      >
        Back to Inquiries
      </Link>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
            {inquiry.source === "plan-your-home"
              ? "Plan Your Home Inquiry"
              : inquiry.source === "general-inquiry"
                ? "General Inquiry"
                : "Legacy Inquiry"}
          </p>
          <span
            className={cn(
              "inline-flex min-h-7 items-center rounded-[var(--hh-radius-tight)] border px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.14em]",
              status.className,
            )}
          >
            {status.label}
          </span>
        </div>
        <h1 className="text-4xl">{inquiry.name}</h1>
        <p className="max-w-3xl text-base leading-7 text-muted">
          Literal customer responses and saved project context. Customer
          answers are read-only in HHQ.
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-2">
        <DetailPanel title="Contact">
          <dl>
            <DetailField label="Name">{inquiry.name}</DetailField>
            <DetailField label="Email">
              {inquiry.email ? (
                <a
                  className="hh-link inline-flex min-h-11 items-center"
                  href={`mailto:${inquiry.email}`}
                >
                  {inquiry.email}
                </a>
              ) : (
                "Not provided"
              )}
            </DetailField>
            <DetailField label="Phone">
              {inquiry.phone ? (
                <a
                  className="hh-link inline-flex min-h-11 items-center"
                  href={`tel:${inquiry.phone}`}
                >
                  {inquiry.phone}
                </a>
              ) : (
                "Not provided"
              )}
            </DetailField>
            {inquiry.source === "general-inquiry" ? (
              <DetailField label="Follow-up basis">
                {inquiry.disclosure}
              </DetailField>
            ) : (
              <>
                <DetailField label="Preferred follow-up">
                  {inquiry.preferredFollowUp ?? "Not provided"}
                </DetailField>
                <DetailField label="Manual follow-up disclosure">
                  {inquiry.disclosure}
                </DetailField>
              </>
            )}
          </dl>
        </DetailPanel>

        {inquiry.source === "plan-your-home" ? (
          <DetailPanel title="Progress and Timing">
            <dl>
              <DetailField label="Progress">{inquiry.progress.summary}</DetailField>
              <DetailField label="Current boundary">
                {inquiry.progress.currentPrompt ?? "Complete"}
              </DetailField>
              <DetailField label="Saved zones">
                {inquiry.progress.completedZones.length > 0
                  ? inquiry.progress.completedZones.join("; ")
                  : "No complete zones recorded"}
              </DetailField>
              <DetailField label="Revision">
                {inquiry.progress.revision ?? "Unavailable"}
              </DetailField>
              <DetailField label="Created">
                {formatTimestamp(inquiry.timestamps.createdAt)}
              </DetailField>
              <DetailField label="Last activity">
                {formatTimestamp(inquiry.timestamps.updatedAt)}
              </DetailField>
              <DetailField label="Submitted">
                {formatTimestamp(inquiry.timestamps.submittedAt)}
              </DetailField>
              <DetailField label="Retention date">
                {formatTimestamp(inquiry.timestamps.expiresAt)}
              </DetailField>
              <DetailField label="Inquiry consent">
                {inquiry.consentVersion
                  ? `${inquiry.consentVersion} · ${formatTimestamp(inquiry.timestamps.consentAcceptedAt)}`
                  : "Not recorded"}
              </DetailField>
            </dl>
          </DetailPanel>
        ) : (
          <DetailPanel title="Submission Timing">
            <dl>
              <DetailField
                label={inquiry.source === "general-inquiry" ? "Received" : "Created"}
              >
                {formatTimestamp(inquiry.timestamps.createdAt)}
              </DetailField>
              {inquiry.source === "legacy" ? (
                <DetailField label="Last activity">
                  {formatTimestamp(inquiry.timestamps.updatedAt)}
                </DetailField>
              ) : null}
            </dl>
          </DetailPanel>
        )}
      </div>

      <section aria-labelledby="inquiry-answers-title" className="space-y-5">
        <div>
          <h2 id="inquiry-answers-title" className="text-2xl">
            Customer Answers
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {inquiry.source === "plan-your-home"
              ? "Questions remain in the exact tour order. Missing or unreadable saved values are called out without exposing malformed data."
              : inquiry.source === "general-inquiry"
                ? "Short general inquiry fields are shown exactly as received."
                : "Legacy form fields remain grouped in their original project-brief order."}
          </p>
        </div>

        {inquiry.answerSections.map((section) => (
          <section
            key={section.id}
            aria-labelledby={`answer-section-${section.id}`}
            className="hh-admin-panel overflow-hidden rounded-[var(--hh-radius-panel)]"
          >
            <div className="border-b border-line-strong bg-background/55 px-5 py-4">
              <h3 id={`answer-section-${section.id}`} className="text-xl">
                {section.title}
              </h3>
            </div>
            <ol className="divide-y divide-line">
              {section.answers.map((answer) => (
                <li
                  key={answer.id}
                  className="grid gap-2 px-5 py-4 lg:grid-cols-[minmax(15rem,0.9fr)_minmax(18rem,1.1fr)] lg:gap-8"
                >
                  <div>
                    {answer.number ? (
                      <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-accent">
                        Question {answer.number}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm font-medium leading-6 text-foreground">
                      {answer.label}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "whitespace-pre-wrap text-sm leading-6",
                      answer.state === "saved"
                        ? "text-muted-strong"
                        : answer.state === "invalid"
                          ? "text-amber-100"
                          : "text-muted",
                    )}
                  >
                    {answer.summary}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </section>

      {inquiry.source === "plan-your-home" ? (
        <DetailPanel title="Private References">
          {inquiry.omittedReferenceCount > 0 ? (
            <AdminNotice tone="error">
              {inquiry.omittedReferenceCount} malformed or mismatched reference
              {inquiry.omittedReferenceCount === 1 ? " was" : "s were"} hidden
              for safety.
            </AdminNotice>
          ) : null}

          {inquiry.references.length > 0 ? (
            <ul className="mt-4 space-y-3" aria-label="Inquiry references">
              {inquiry.references.map((reference) => (
                <li
                  key={reference.id}
                  className="rounded-[var(--hh-radius-tight)] border border-line-strong bg-background/50 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-medium text-foreground">
                        {reference.kind === "file"
                          ? reference.originalName
                          : reference.hostname}
                      </p>
                      <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                        {reference.kind === "file"
                          ? `${formatBytes(reference.sizeBytes)} · ${reference.mimeType}`
                          : new URL(reference.url).protocol === "https:"
                            ? "Secure external link"
                            : "External http link"}
                      </p>
                      {reference.note ? (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-strong">
                          {reference.note}
                        </p>
                      ) : null}
                    </div>

                    {reference.kind === "file" ? (
                      <form
                        action="/admin/inquiries/file"
                        method="post"
                        target="_blank"
                        className="shrink-0"
                      >
                        <input
                          type="hidden"
                          name="inquiryId"
                          value={inquiry.id}
                        />
                        <input
                          type="hidden"
                          name="referenceId"
                          value={reference.id}
                        />
                        <button
                          type="submit"
                          className={cn(
                            buttonVariants({ variant: "secondary", size: "sm" }),
                            "hh-admin-button hh-admin-button-secondary min-h-11 w-full rounded-[var(--hh-radius-tight)] sm:w-auto",
                          )}
                        >
                          Open Private File
                        </button>
                      </form>
                    ) : (
                      <a
                        href={reference.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ variant: "secondary", size: "sm" }),
                          "hh-admin-button hh-admin-button-secondary min-h-11 w-full shrink-0 rounded-[var(--hh-radius-tight)] sm:w-auto",
                        )}
                      >
                        Open {reference.hostname}
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-muted">
              No readable references are saved with this inquiry.
            </p>
          )}
        </DetailPanel>
      ) : null}

      <DetailPanel title="Inquiry Actions">
        <p className="mb-5 max-w-2xl text-sm leading-6 text-muted">
          Status changes are recorded for internal accountability. Deletion is
          permanent and includes resume links, pending uploads, and all private
          files under this inquiry.
        </p>
        <AdminInquiryActions
          inquiryId={inquiry.id}
          status={inquiry.status}
          statusAction={statusAction}
          deleteAction={deleteAction}
        />
      </DetailPanel>
    </div>
  );
}
