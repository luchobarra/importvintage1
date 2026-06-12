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
    <header className="admin-header">
      <div>
        <p className="admin-header__eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description ? (
          <p className="admin-header__session">{description}</p>
        ) : null}
      </div>

      {actions}
    </header>
  );
}

