import "./hhq.css";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="hhq-theme">{children}</div>;
}
