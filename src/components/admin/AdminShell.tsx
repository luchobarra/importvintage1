type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <main className="admin-page">
      <section className="admin-shell ui-page-container">{children}</section>
    </main>
  );
}
