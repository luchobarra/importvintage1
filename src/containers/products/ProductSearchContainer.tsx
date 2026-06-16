"use client";

import { EmptyProductList } from "@/components/products/EmptyProductList";
import { ProductList } from "@/components/products/ProductList";
import {
  ProductSearch,
  type ProductSearchFilterKey,
  type ProductSearchFilters,
} from "@/components/products/ProductSearch";
import {
  getProductBrandName,
  getProductCategoryName,
  getProductSizeLabel,
} from "@/features/products/formatters";
import type { Product } from "@/features/products/types";
import { useMemo, useState } from "react";

type ProductSearchContainerProps = {
  products: Product[];
};

const emptyFilters: ProductSearchFilters = {
  id: "",
  title: "",
  brand: "",
  category: "",
  size: "",
};

export function ProductSearchContainer({
  products,
}: ProductSearchContainerProps) {
  const [filters, setFilters] = useState<ProductSearchFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<ProductSearchFilters>(emptyFilters);
  const [errorMessage, setErrorMessage] = useState("");

  const filteredProducts = useMemo(() => {
    if (!hasActiveFilters(appliedFilters)) {
      return products;
    }

    const normalizedFilters = normalizeFilters(appliedFilters);

    const results = products.filter((product) => {
      if (
        normalizedFilters.id &&
        !normalizeText(product.id).includes(normalizedFilters.id)
      ) {
        return false;
      }

      if (
        normalizedFilters.title &&
        !normalizeText(product.title).includes(normalizedFilters.title)
      ) {
        return false;
      }

      if (
        normalizedFilters.brand &&
        !normalizeText(getProductBrandName(product)).includes(
          normalizedFilters.brand,
        )
      ) {
        return false;
      }

      if (
        normalizedFilters.category &&
        normalizeText(getProductCategoryName(product)) !==
          normalizedFilters.category
      ) {
        return false;
      }

      if (
        normalizedFilters.size &&
        normalizeSize(getProductSizeLabel(product)) !== normalizedFilters.size
      ) {
        return false;
      }

      return true;
    });

    if (!normalizedFilters.title) {
      return results;
    }

    return [...results].sort((firstProduct, secondProduct) => {
      const firstTitle = normalizeText(firstProduct.title);
      const secondTitle = normalizeText(secondProduct.title);
      const firstStartsWithTitle = firstTitle.startsWith(
        normalizedFilters.title,
      );
      const secondStartsWithTitle = secondTitle.startsWith(
        normalizedFilters.title,
      );

      if (firstStartsWithTitle === secondStartsWithTitle) {
        return 0;
      }

      return firstStartsWithTitle ? -1 : 1;
    });
  }, [appliedFilters, products]);

  function handleFilterChange(field: ProductSearchFilterKey, value: string) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: field === "size" ? normalizeSize(value) : value,
    }));
  }

  function handleSearch() {
    if (!areTextFiltersValid(filters)) {
      setErrorMessage("Ingresá al menos 3 caracteres.");
      return;
    }

    setErrorMessage("");
    setAppliedFilters(filters);
  }

  function handleClear() {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setErrorMessage("");
  }

  return (
    <>
      <ProductSearch
        errorMessage={errorMessage}
        filters={filters}
        onClear={handleClear}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        resultCount={filteredProducts.length}
        totalCount={products.length}
      />

      {filteredProducts.length > 0 ? (
        <ProductList products={filteredProducts} />
      ) : (
        <EmptyProductList
          title="No se encontraron productos"
          message="Proba buscar por ID, titulo, marca, categoria o talle."
        />
      )}
    </>
  );
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function normalizeSize(value: string) {
  return value.trim().toUpperCase();
}

function normalizeFilters(filters: ProductSearchFilters) {
  return {
    id: normalizeText(filters.id),
    title: normalizeText(filters.title),
    brand: normalizeText(filters.brand),
    category: normalizeText(filters.category),
    size: normalizeSize(filters.size),
  };
}

function hasActiveFilters(filters: ProductSearchFilters) {
  return Object.values(filters).some((value) => value.trim() !== "");
}

function areTextFiltersValid(filters: ProductSearchFilters) {
  const titleLength = filters.title.trim().length;
  const brandLength = filters.brand.trim().length;

  return (
    (titleLength === 0 || titleLength >= 3) &&
    (brandLength === 0 || brandLength >= 3)
  );
}
