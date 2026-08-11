import { NextResponse, type NextRequest } from "next/server";

import { isAdminInquiryId } from "@/features/plan-your-home/admin-inquiry-detail";
import { getAdminInquiryDetailRepository } from "@/lib/db/admin-inquiry-detail";
import { requireAdminUser } from "@/lib/firebase/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = await requireAdminUser();
  const formData = await request.formData();
  const inquiryId = formData.get("inquiryId");
  const referenceId = formData.get("referenceId");
  let destination = new URL("/admin/inquiries", request.url);

  if (
    isAdminInquiryId(inquiryId) &&
    typeof referenceId === "string" &&
    referenceId.length > 0
  ) {
    destination = new URL(
      `/admin/inquiries/${encodeURIComponent(inquiryId)}?file=unavailable`,
      request.url,
    );
    try {
      const capability =
        await getAdminInquiryDetailRepository().issueSignedRead(
          inquiryId,
          referenceId,
          { uid: admin.uid },
        );
      destination = new URL(capability.url);
    } catch {
      // Generic authenticated fallback; never log private paths or signed URLs.
    }
  }

  return NextResponse.redirect(destination, 303);
}
