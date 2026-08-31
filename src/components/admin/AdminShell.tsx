import type { ComponentPropsWithoutRef } from "react";

type AdminShellProps = ComponentPropsWithoutRef<"section">;

export function AdminShell({
  children,
  className = "",
  ...props
}: AdminShellProps) {
  return (
    <section className={`admin-shell ${className}`.trim()} {...props}>
      {children}
    </section>
  );
}
