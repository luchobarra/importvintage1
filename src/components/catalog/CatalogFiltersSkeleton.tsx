export function CatalogFiltersSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="catalog-filters catalog-filters--skeleton"
    >
      <div className="catalog-filters__toolbar catalog-filters__toolbar--skeleton">
        <div className="catalog-filters__toolbar-skeleton-item" />
        <span className="catalog-filters__divider" aria-hidden="true">
          |
        </span>
        <div className="catalog-filters__toolbar-skeleton-item" />
      </div>
      <div className="catalog-filters__active-band" data-empty="true" />
    </section>
  );
}
