import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  deleteAdminInquiryAction,
  updateAdminInquiryStatusAction,
} from "@/app/admin/inquiries/actions";
import { AdminInquiryDetailView } from "@/components/admin/admin-inquiry-detail";
import { AdminNotice } from "@/components/admin/admin-notice";
import {
  AdminInquiryNotFoundError,
  type AdminInquiryDetail,
} from "@/features/plan-your-home/admin-inquiry-detail";
import { formatAdminPageTitle } from "@/lib/admin/branding";
import { getAuthorizedAdminInquiryDetailRepository } from "@/lib/db/admin-inquiry-detail";
import { createPageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: formatAdminPageTitle("Inquiry Detail"),
  description: "Review a private project inquiry in HHQ.",
  path: "/admin/inquiries",
  noIndex: true,
});

type AdminInquiryDetailPageProps = Readonly<{
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    updated?: string;
    file?: string;
    deletion?: string;
  }>;
}>;

export default async function AdminInquiryDetailPage({
  params,
  searchParams,
}: AdminInquiryDetailPageProps) {
  const { admin, repository } =
    await getAuthorizedAdminInquiryDetailRepository();
  const { id } = await params;
  const { updated, file, deletion } = await searchParams;
  let inquiry: AdminInquiryDetail | null = null;
  let missing = false;
  let errorMessage: string | null = null;

  try {
    inquiry = await repository.read(id, {
      uid: admin.uid,
    });
  } catch (error) {
    if (error instanceof AdminInquiryNotFoundError) {
      missing = true;
    } else {
      errorMessage =
        "This inquiry could not be loaded right now. Return to the queue and try again.";
    }
  }

  if (missing) notFound();

  if (!inquiry || errorMessage) {
    return (
      <div className="space-y-5">
        <h1 className="text-4xl">Inquiry unavailable</h1>
        <AdminNotice tone="error">
          {errorMessage ??
            "This inquiry could not be loaded right now. Return to the queue and try again."}
        </AdminNotice>
        <Link
          className="hh-link inline-flex min-h-11 items-center text-sm text-muted-strong"
          href="/admin/inquiries"
        >
          Return to inquiries
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {updated === "reviewed" || updated === "spam" ? (
        <AdminNotice tone="success">
          Inquiry marked {updated === "reviewed" ? "Reviewed" : "Spam"}.
        </AdminNotice>
      ) : null}
      {file === "unavailable" ? (
        <AdminNotice tone="error">
          The private file could not be opened. It may be missing or no longer
          match the saved reference.
        </AdminNotice>
      ) : null}
      {deletion === "pending" ? (
        <AdminNotice tone="info">
          Deletion is pending while a recently issued private upload link
          expires. Return to this detail and choose Delete Inquiry again shortly
          to complete the final private-file sweep.
        </AdminNotice>
      ) : null}
      <AdminInquiryDetailView
        inquiry={inquiry}
        statusAction={updateAdminInquiryStatusAction}
        deleteAction={deleteAdminInquiryAction}
      />
    </div>
  );
}
