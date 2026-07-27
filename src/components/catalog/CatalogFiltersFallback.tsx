import { ArrowDownUp, SlidersHorizontal } from "lucide-react";

export function CatalogFiltersFallback() {
  return (
    <section aria-hidden="true" className="catalog-filters">
      <div className="catalog-filters__toolbar catalog-filters__toolbar--fallback">
        <button
          className="catalog-filters__trigger"
          disabled
          tabIndex={-1}
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" size={12} strokeWidth={2} />
          <span>Filtrar</span>
        </button>
        <span className="catalog-filters__divider" aria-hidden="true">
          |
        </span>
        <button
          className="catalog-filters__sort-trigger"
          disabled
          tabIndex={-1}
          type="button"
        >
          <ArrowDownUp aria-hidden="true" size={12} strokeWidth={2} />
          <span>Ordenar</span>
        </button>
      </div>
      <div className="catalog-filters__active-band" data-empty="true" />
    </section>
  );
}
