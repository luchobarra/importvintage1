type AdminShellProps = {
  className?: string;
  children: React.ReactNode;
};

export function AdminShell({ children, className = "" }: AdminShellProps) {
  return (
    <main className="admin-page">
      <section className={`admin-shell ui-page-container ${className}`.trim()}>
        {children}
      </section>
    </main>
  );
}
