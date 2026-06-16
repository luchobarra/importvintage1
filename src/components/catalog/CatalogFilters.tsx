"use client";

import type { CatalogOptions } from "@/features/catalog-options/types";
import type { PublicCatalogState } from "@/features/products/public-filters";
import Link from "next/link";
import { useMemo, useState } from "react";

type CatalogFiltersProps = {
  hasActiveControls: boolean;
  options: CatalogOptions;
  state: PublicCatalogState;
};

export function CatalogFilters({
  hasActiveControls,
  options,
  state,
}: CatalogFiltersProps) {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(
    state.category,
  );
  const availableSizes = useMemo(
    () => getAvailableSizes(options, selectedCategorySlug),
    [options, selectedCategorySlug],
  );

  return (
    <form action="" className="catalog-filters">
      <div className="catalog-filters__fields">
        <label className="form-field" htmlFor="catalog-brand">
          <span>Marca</span>
          <select
            defaultValue={state.brand}
            id="catalog-brand"
            name="brand"
          >
            <option value="">Todas</option>
            {options.brands.map((brand) => (
              <option key={brand.id} value={brand.slug}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field" htmlFor="catalog-category">
          <span>Categoria</span>
          <select
            defaultValue={state.category}
            id="catalog-category"
            name="category"
            onChange={(event) => setSelectedCategorySlug(event.target.value)}
          >
            <option value="">Todas</option>
            {options.categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field" htmlFor="catalog-size">
          <span>Talle</span>
          <select
            defaultValue={state.size}
            id="catalog-size"
            key={selectedCategorySlug}
            name="size"
          >
            <option value="">Todos</option>
            {availableSizes.map((size) => (
              <option key={size.id} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
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

function getAvailableSizes(
  options: CatalogOptions,
  selectedCategorySlug: string,
) {
  if (!selectedCategorySlug) {
    return options.sizes;
  }

  const selectedCategory = options.categories.find(
    (category) => category.slug === selectedCategorySlug,
  );

  if (!selectedCategory) {
    return options.sizes;
  }

  const allowedGroups = new Set<string>();

  if (selectedCategory.sizes_letter_enabled) {
    allowedGroups.add("letter");
  }

  if (selectedCategory.sizes_numeric_enabled) {
    allowedGroups.add("numeric");
  }

  if (allowedGroups.size === 0) {
    return [];
  }

  return options.sizes.filter((size) => allowedGroups.has(size.size_group));
}
