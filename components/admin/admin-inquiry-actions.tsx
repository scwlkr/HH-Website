"use client";

import { useActionState, useRef } from "react";

import {
  adminInquiryActionInitialState,
  type AdminInquiryActionState,
} from "@/features/plan-your-home/admin-inquiry-actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { Button } from "@/components/ui/button";
import type { AdminInquiryDetailStatus } from "@/features/plan-your-home/admin-inquiry-detail";

export function AdminInquiryActions({
  inquiryId,
  status,
  statusAction,
  deleteAction,
}: Readonly<{
  inquiryId: string;
  status: AdminInquiryDetailStatus;
  statusAction: (
    state: AdminInquiryActionState,
    formData: FormData,
  ) => Promise<AdminInquiryActionState>;
  deleteAction: (
    state: AdminInquiryActionState,
    formData: FormData,
  ) => Promise<AdminInquiryActionState>;
}>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [statusState, statusFormAction, statusPending] = useActionState(
    statusAction,
    adminInquiryActionInitialState,
  );
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    deleteAction,
    adminInquiryActionInitialState,
  );

  return (
    <div className="space-y-4">
      {statusState.message ? (
        <AdminNotice tone="error">{statusState.message}</AdminNotice>
      ) : null}
      {deleteState.message ? (
        <AdminNotice tone="error">{deleteState.message}</AdminNotice>
      ) : null}

      {status !== "deleting" ? (
        <form
          action={statusFormAction}
          className="flex flex-col gap-3 min-[440px]:flex-row"
        >
          <input type="hidden" name="inquiryId" value={inquiryId} />
          <Button
            type="submit"
            name="status"
            value="reviewed"
            variant="secondary"
            disabled={statusPending || status === "reviewed"}
            className="hh-admin-button hh-admin-button-secondary rounded-[var(--hh-radius-tight)]"
          >
            {status === "reviewed" ? "Marked Reviewed" : "Mark Reviewed"}
          </Button>
          <Button
            type="submit"
            name="status"
            value="spam"
            variant="secondary"
            disabled={statusPending || status === "spam"}
            className="rounded-[var(--hh-radius-tight)] border-rose-300/35 bg-rose-300/10 text-rose-100 hover:border-rose-200 hover:bg-rose-300/20 hover:text-rose-50"
          >
            {status === "spam" ? "Marked Spam" : "Mark Spam"}
          </Button>
        </form>
      ) : (
        <AdminNotice tone="info">
          A previous deletion did not finish. Retry deletion to remove the
          remaining private files and records.
        </AdminNotice>
      )}

      <div className="border-t border-line pt-4">
        <Button
          type="button"
          variant="ghost"
          className="rounded-[var(--hh-radius-tight)] border-rose-300/35 text-rose-100 hover:border-rose-200 hover:bg-rose-300/10 hover:text-rose-50"
          onClick={() => dialogRef.current?.showModal()}
        >
          Delete Inquiry
        </Button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="delete-inquiry-title"
        aria-describedby="delete-inquiry-description"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(34rem,calc(100%-2rem))] overflow-auto rounded-[var(--hh-radius-panel)] border border-line-strong bg-surface-raised p-0 text-foreground shadow-2xl backdrop:bg-black/75"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-rose-200">
              Destructive action
            </p>
            <h2 id="delete-inquiry-title" className="mt-3 text-2xl">
              Delete this inquiry?
            </h2>
            <p
              id="delete-inquiry-description"
              className="mt-3 text-sm leading-6 text-muted-strong"
            >
              This permanently removes the inquiry, resume links, pending
              uploads, and every private file saved for this draft. This cannot
              be undone.
            </p>
          </div>

          <form action={deleteFormAction} className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <input type="hidden" name="inquiryId" value={inquiryId} />
            <input
              type="hidden"
              name="confirmation"
              value="delete-inquiry"
            />
            <Button
              type="button"
              variant="secondary"
              disabled={deletePending}
              className="hh-admin-button hh-admin-button-secondary rounded-[var(--hh-radius-tight)]"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={deletePending}
              className="rounded-[var(--hh-radius-tight)] border-rose-300 bg-rose-300 text-[#28090d] hover:border-rose-200 hover:bg-rose-200"
            >
              {deletePending ? "Deleting…" : "Delete Inquiry and Files"}
            </Button>
          </form>
        </div>
      </dialog>
    </div>
  );
}
