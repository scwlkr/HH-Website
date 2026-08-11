"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import {
  adminInquiryMutableStatuses,
  isAdminInquiryId,
  type AdminInquiryMutableStatus,
} from "@/features/plan-your-home/admin-inquiry-detail";
import {
  adminInquiryActionInitialState,
  type AdminInquiryActionState,
} from "@/features/plan-your-home/admin-inquiry-actions";
import { getAdminInquiryDetailRepository } from "@/lib/db/admin-inquiry-detail";
import { requireAdminUser } from "@/lib/firebase/auth";

function readFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : null;
}

function detailRoute(inquiryId: string) {
  return `/admin/inquiries/${encodeURIComponent(inquiryId)}` as Route;
}

export async function updateAdminInquiryStatusAction(
  previousState: AdminInquiryActionState = adminInquiryActionInitialState,
  formData: FormData,
): Promise<AdminInquiryActionState> {
  void previousState;
  const admin = await requireAdminUser();
  const inquiryId = readFormValue(formData, "inquiryId");
  const requestedStatus = readFormValue(formData, "status");
  if (
    !isAdminInquiryId(inquiryId) ||
    requestedStatus === null ||
    !adminInquiryMutableStatuses.includes(
      requestedStatus as AdminInquiryMutableStatus,
    )
  ) {
    return {
      status: "error",
      message: "The inquiry status could not be changed. Refresh and try again.",
    };
  }

  try {
    await getAdminInquiryDetailRepository().updateStatus(
      inquiryId,
      requestedStatus as AdminInquiryMutableStatus,
      { uid: admin.uid },
    );
  } catch {
    return {
      status: "error",
      message: "The inquiry status could not be changed. Refresh and try again.",
    };
  }

  redirect(
    `${detailRoute(inquiryId)}?updated=${encodeURIComponent(requestedStatus)}` as Route,
  );
}

export async function deleteAdminInquiryAction(
  previousState: AdminInquiryActionState = adminInquiryActionInitialState,
  formData: FormData,
): Promise<AdminInquiryActionState> {
  void previousState;
  const admin = await requireAdminUser();
  const inquiryId = readFormValue(formData, "inquiryId");
  const confirmation = readFormValue(formData, "confirmation");
  if (!isAdminInquiryId(inquiryId) || confirmation !== "delete-inquiry") {
    return {
      status: "error",
      message: "Confirm deletion before removing this inquiry.",
    };
  }

  try {
    await getAdminInquiryDetailRepository().deleteInquiry(inquiryId, {
      uid: admin.uid,
    });
  } catch {
    return {
      status: "error",
      message:
        "The inquiry was not completely deleted. Choose Delete inquiry again to safely retry.",
    };
  }

  redirect("/admin/inquiries?deleted=1" as Route);
}
