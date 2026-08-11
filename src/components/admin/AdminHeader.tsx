import { BrandLogo } from "@/components/layout/BrandLogo";
import Link from "next/link";

type AdminHeaderProps = {
  eyebrow: string;
  title: string;
  className?: string;
  description?: string;
  actions?: React.ReactNode;
};

export function AdminHeader({
  className = "",
  eyebrow,
  title,
  description,
  actions,
}: AdminHeaderProps) {
  return (
    <header className={`admin-header ui-section-header ${className}`.trim()}>
      <div className="admin-header__copy-row">
        <Link
          aria-label="Ir al inicio del panel Retro Campus"
          className="admin-header__brand"
          href="/retro-campus-admin"
        >
          <BrandLogo className="admin-header__brand-logo" sizes="88px" />
        </Link>
        <div className="ui-section-header__copy">
          <p className="admin-header__eyebrow ui-section-header__eyebrow text-overline">
            {eyebrow}
          </p>
          <h1 className="ui-section-header__title text-h1">{title}</h1>
          {description ? (
            <p className="admin-header__session ui-section-header__description text-body">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {actions}
    </header>
  );
}
