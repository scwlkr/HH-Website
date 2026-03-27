type AdminNoticeProps = {
  tone?: "success" | "error" | "info";
  children: React.ReactNode;
};

const toneClasses = {
  success: "border-accent/35 bg-accent-soft text-accent-strong",
  error: "border-red-400/35 bg-red-50 text-red-700",
  info: "border-line-strong bg-surface-raised text-muted-strong",
} as const;

export function AdminNotice({
  children,
  tone = "info",
}: AdminNoticeProps) {
  return (
    <div
      className={`rounded-[var(--hh-radius-tight)] border px-4 py-3 text-sm ${toneClasses[tone]}`}
    >
      {children}
    </div>
  );
}
