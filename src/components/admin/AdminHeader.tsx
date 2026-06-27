type AdminHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function AdminHeader({
  eyebrow,
  title,
  description,
  actions,
}: AdminHeaderProps) {
  return (
    <header className="admin-header ui-section-header">
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

      {actions}
    </header>
  );
}
