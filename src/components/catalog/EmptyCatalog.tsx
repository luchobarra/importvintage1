import type { ReactNode } from "react";

type EmptyCatalogProps = {
  children?: ReactNode;
  isError?: boolean;
  message: string;
  title: string;
};

export function EmptyCatalog({
  children,
  isError = false,
  message,
  title,
}: EmptyCatalogProps) {
  return (
    <div
      className={`home__empty-state ui-empty-state${
        isError ? " home__empty-state--error" : ""
      }`}
    >
      <div className="home__empty-content ui-empty-state__content">
        <p className="home__empty-kicker">Catalogo</p>
        <h2 className="text-h2">{title}</h2>
        <div className="home__empty-ornament" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="text-body">{message}</p>
        {children ? <div className="home__empty-actions">{children}</div> : null}
      </div>
    </div>
  );
}
