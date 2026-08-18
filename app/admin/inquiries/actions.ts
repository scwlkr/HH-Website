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
import { getAuthorizedAdminInquiryDetailRepository } from "@/lib/db/admin-inquiry-detail";

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
  const { admin, repository } =
    await getAuthorizedAdminInquiryDetailRepository();
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
    await repository.updateStatus(
      inquiryId,
      requestedStatus as AdminInquiryMutableStatus,
      { uid: admin.uid },
    );
  } catch (error) {
    console.error("HHQ inquiry status update failed.", error);
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
  const { admin, repository } =
    await getAuthorizedAdminInquiryDetailRepository();
  const inquiryId = readFormValue(formData, "inquiryId");
  const confirmation = readFormValue(formData, "confirmation");
  if (!isAdminInquiryId(inquiryId) || confirmation !== "delete-inquiry") {
    return {
      status: "error",
      message: "Confirm deletion before removing this inquiry.",
    };
  }

  let result;
  try {
    result = await repository.deleteInquiry(inquiryId, {
      uid: admin.uid,
    });
  } catch (error) {
    console.error("HHQ inquiry deletion failed.", error);
    return {
      status: "error",
      message:
        "The inquiry was not completely deleted. Choose Delete inquiry again to safely retry.",
    };
  }

  if ("pending" in result && result.pending) {
    redirect(`${detailRoute(inquiryId)}?deletion=pending` as Route);
  }

  redirect("/admin/inquiries?deleted=1" as Route);
}
