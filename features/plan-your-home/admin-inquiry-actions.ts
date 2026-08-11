export type AdminInquiryActionState = Readonly<{
  status: "idle" | "error";
  message?: string;
}>;

export const adminInquiryActionInitialState: AdminInquiryActionState = {
  status: "idle",
};
