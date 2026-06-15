import { PRODUCT_CATEGORIES } from "@/features/products/constants";
import type { PublicCatalogState } from "@/features/products/public-filters";
import Link from "next/link";

type CatalogFiltersProps = {
  hasActiveControls: boolean;
  state: PublicCatalogState;
};

export function CatalogFilters({
  hasActiveControls,
  state,
}: CatalogFiltersProps) {
  return (
    <form action="" className="catalog-filters">
      <div className="catalog-filters__fields">
        <label className="form-field" htmlFor="catalog-brand">
          <span>Marca</span>
          <input
            defaultValue={state.brand}
            id="catalog-brand"
            name="brand"
            placeholder="Ej: vintage"
            type="search"
          />
        </label>

        <label className="form-field" htmlFor="catalog-category">
          <span>Categoria</span>
          <select
            defaultValue={state.category}
            id="catalog-category"
            name="category"
          >
            <option value="">Todas</option>
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {formatCategory(category)}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field" htmlFor="catalog-size">
          <span>Talle</span>
          <input
            className="input-uppercase"
            defaultValue={state.size}
            id="catalog-size"
            name="size"
            placeholder="Ej: L"
            type="search"
          />
        </label>

        <label className="form-field" htmlFor="catalog-sort">
          <span>Ordenar</span>
          <select defaultValue={state.sort} id="catalog-sort" name="sort">
            <option value="newest">Mas recientes</option>
            <option value="price_asc">Menor precio</option>
            <option value="price_desc">Mayor precio</option>
          </select>
        </label>
      </div>

      <div className="catalog-filters__actions">
        <button className="button button--primary" type="submit">
          Aplicar filtros
        </button>
        {hasActiveControls ? (
          <Link className="button" href="/">
            Limpiar filtros
          </Link>
        ) : (
          <button className="button" disabled type="button">
            Limpiar filtros
          </button>
        )}
      </div>
    </form>
  );
}

function formatCategory(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}
