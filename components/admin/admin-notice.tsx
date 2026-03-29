type AdminNoticeProps = {
  tone?: "success" | "error" | "info";
  children: React.ReactNode;
};

const toneClasses = {
  success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100",
  error: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  info: "border-line-strong bg-background/70 text-muted-strong",
} as const;

export function AdminNotice({
  children,
  tone = "info",
}: AdminNoticeProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`rounded-[var(--hh-radius-tight)] border px-4 py-3 text-sm ${toneClasses[tone]}`}
    >
      {children}
    </div>
  );
}
