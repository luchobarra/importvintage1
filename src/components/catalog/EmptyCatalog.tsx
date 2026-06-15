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
      className={`home__empty-state${isError ? " home__empty-state--error" : ""}`}
    >
      <div className="home__empty-content">
        <h2>{title}</h2>
        <p>{message}</p>
        {children ? <div className="home__empty-actions">{children}</div> : null}
      </div>
    </div>
  );
}
