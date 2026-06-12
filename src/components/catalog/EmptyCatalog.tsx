type EmptyCatalogProps = {
  isError?: boolean;
  message: string;
  title: string;
};

export function EmptyCatalog({ isError = false, message, title }: EmptyCatalogProps) {
  return (
    <div
      className={`home__empty-state${isError ? " home__empty-state--error" : ""}`}
    >
      <div className="home__empty-content">
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
    </div>
  );
}

