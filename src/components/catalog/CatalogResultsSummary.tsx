type CatalogResultsSummaryProps = {
  totalCount: number;
};

export function CatalogResultsSummary({
  totalCount,
}: CatalogResultsSummaryProps) {
  const label =
    totalCount === 1 ? "1 producto encontrado" : `${totalCount} productos encontrados`;

  return (
    <p aria-live="polite" className="catalog-results-summary">
      {label}
    </p>
  );
}
