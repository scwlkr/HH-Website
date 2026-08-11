export function InquiryPrivacyNotice({
  placement,
}: Readonly<{ placement: "start" | "submit" }>) {
  if (placement === "start") {
    return (
      <p className="mt-6 border-l-2 border-accent pl-4 text-sm leading-7 text-muted">
        Before you share contact details: this general brief is stored only when
        you send it so h and h can follow up personally. Sending begins a
        conversation, not a design, price, feasibility decision, or contract.
        Review the{" "}
        <a className="hh-link hh-touch-target text-foreground" href="/privacy">
          privacy and retention policy
        </a>
        .
      </p>
    );
  }

  return (
    <p className="text-sm leading-6 text-muted">
      Rough answers are welcome. Sending permits project-related follow-up under
      the{" "}
      <a className="hh-link hh-touch-target text-foreground" href="/privacy">
        privacy policy
      </a>
      ; it is not marketing consent or a contract.
    </p>
  );
}
