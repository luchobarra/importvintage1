import { PRODUCT_CATEGORIES } from "@/features/products/constants";
import type { FormEvent } from "react";

export type ProductSearchFilters = {
  id: string;
  title: string;
  brand: string;
  category: string;
  size: string;
};

export type ProductSearchFilterKey = keyof ProductSearchFilters;

type ProductSearchProps = {
  errorMessage: string;
  filters: ProductSearchFilters;
  resultCount: number;
  totalCount: number;
  onClear: () => void;
  onFilterChange: (field: ProductSearchFilterKey, value: string) => void;
  onSearch: () => void;
};

export function ProductSearch({
  errorMessage,
  filters,
  resultCount,
  totalCount,
  onClear,
  onFilterChange,
  onSearch,
}: ProductSearchProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch();
  }

  return (
    <form className="product-search" onSubmit={handleSubmit}>
      <div className="product-search__fields">
        <label className="form-field" htmlFor="product-search-id">
          <span>ID</span>
          <input
            id="product-search-id"
            name="product-search-id"
            onChange={(event) => onFilterChange("id", event.target.value)}
            placeholder="Escribir ID"
            type="search"
            value={filters.id}
          />
        </label>

        <label className="form-field" htmlFor="product-search-title">
          <span>Titulo</span>
          <input
            id="product-search-title"
            name="product-search-title"
            onChange={(event) => onFilterChange("title", event.target.value)}
            placeholder="Minimo 3 letras"
            type="search"
            value={filters.title}
          />
        </label>

        <label className="form-field" htmlFor="product-search-brand">
          <span>Marca</span>
          <input
            id="product-search-brand"
            name="product-search-brand"
            onChange={(event) => onFilterChange("brand", event.target.value)}
            placeholder="Minimo 3 letras"
            type="search"
            value={filters.brand}
          />
        </label>

        <label className="form-field" htmlFor="product-search-category">
          <span>Categoria</span>
          <select
            id="product-search-category"
            name="product-search-category"
            onChange={(event) => onFilterChange("category", event.target.value)}
            value={filters.category}
          >
            <option value="">Todas</option>
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {formatCategory(category)}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field" htmlFor="product-search-size">
          <span>Talle</span>
          <input
            className="input-uppercase"
            id="product-search-size"
            name="product-search-size"
            onChange={(event) => onFilterChange("size", event.target.value)}
            placeholder="Escribir talle"
            type="search"
            value={filters.size}
          />
        </label>
      </div>

      <div className="product-search__actions">
        <button className="button button--primary" type="submit">
          Buscar
        </button>
        <button className="button" onClick={onClear} type="button">
          Limpiar
        </button>
      </div>

      {errorMessage ? (
        <p className="auth-form__error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <p aria-live="polite">
        {resultCount} de {totalCount} productos
      </p>
    </form>
  );
}

function formatCategory(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

