import type { Metadata } from "next";

import { AdminInquiryQueue } from "@/components/admin/admin-inquiry-queue";
import {
  parseAdminInquiryStatusFilter,
  type AdminInquiryQueueItem,
} from "@/features/plan-your-home/admin-inquiry-queue";
import { formatAdminPageTitle } from "@/lib/admin/branding";
import { getAuthorizedAdminInquiryQueue } from "@/lib/db/admin-inquiries";
import { createPageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: formatAdminPageTitle("Inquiries"),
  description: "Review project inquiries in HHQ, the Howeth and Harp admin workspace.",
  path: "/admin/inquiries",
  noIndex: true,
});

type AdminInquiriesPageProps = {
  searchParams: Promise<{
    status?: string | string[];
  }>;
};

export default async function AdminInquiriesPage({
  searchParams,
}: AdminInquiriesPageProps) {
  const resolvedSearchParams = await searchParams;
  const statusFilter = parseAdminInquiryStatusFilter(
    resolvedSearchParams.status,
  );
  const inquiryQueue = await getAuthorizedAdminInquiryQueue();
  let inquiries: readonly AdminInquiryQueueItem[] = [];
  let errorMessage: string | undefined;

  try {
    inquiries = await inquiryQueue.list(statusFilter);
  } catch {
    errorMessage =
      "Inquiries could not be loaded right now. Refresh this page to try again.";
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
          HHQ Inquiries
        </p>
        <h1 className="mt-3 text-4xl">Project Inquiries</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted">
          Review saved Plan Your Home drafts and completed inquiries in one
          activity-ordered queue. Legacy project briefs remain visible here.
        </p>
      </div>

      <AdminInquiryQueue
        inquiries={inquiries}
        statusFilter={statusFilter}
        errorMessage={errorMessage}
      />
    </div>
  );
}
