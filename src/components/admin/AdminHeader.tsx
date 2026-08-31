type AdminHeaderProps = {
  eyebrow?: string;
  title: string;
  className?: string;
  description?: string;
  actions?: React.ReactNode;
};

export function AdminHeader({
  className = "",
  title,
  description,
  actions,
}: AdminHeaderProps) {
  return (
    <header className={`admin-header ui-section-header ${className}`.trim()}>
      <div className="admin-header__copy-row">
        <div className="ui-section-header__copy">
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
