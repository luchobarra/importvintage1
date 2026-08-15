"use client";

import { ProductCard } from "@/components/catalog/ProductCard";
import { type PublicCatalogState } from "@/features/products/public-filters";
import type { Product } from "@/features/products/types";
import { useState } from "react";

type ProductGridProps = {
  catalogHref: string;
  initialState?: PublicCatalogState;
  products: Product[];
  totalCount?: number;
};

type ProductsPageResponse = {
  products: Product[];
  totalCount: number;
};

const LOAD_MORE_MIN_DELAY_MS = 1400;

export function ProductGrid({
  catalogHref,
  initialState,
  products,
  totalCount = products.length,
}: ProductGridProps) {
  const [visibleProducts, setVisibleProducts] = useState(products);
  const [availableProductCount, setAvailableProductCount] = useState(totalCount);
  const [loadedPages, setLoadedPages] = useState(initialState?.page ?? 1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const canLoadMore =
    Boolean(initialState) && visibleProducts.length < availableProductCount;
  const hasLoadedAllProducts =
    Boolean(initialState) &&
    availableProductCount > 0 &&
    visibleProducts.length >= availableProductCount;

  async function loadMoreProducts() {
    if (!initialState || isLoadingMore || !canLoadMore) {
      return;
    }

    const nextPage = loadedPages + 1;

    setErrorMessage("");
    setIsLoadingMore(true);

    try {
      const [response] = await Promise.all([
        fetch(createProductsApiHref(initialState, nextPage), {
          headers: {
            Accept: "application/json",
          },
        }),
        wait(LOAD_MORE_MIN_DELAY_MS),
      ]);

      if (!response.ok) {
        throw new Error("No se pudieron cargar más productos.");
      }

      const data = (await response.json()) as ProductsPageResponse;

      setAvailableProductCount(data.totalCount);
      setVisibleProducts((currentProducts) => [
        ...currentProducts,
        ...data.products.filter(
          (product) =>
            !currentProducts.some(
              (currentProduct) => currentProduct.id === product.id,
            ),
        ),
      ]);
      setLoadedPages(nextPage);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar más productos.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <>
      <div className="product-grid">
        {visibleProducts.map((product, index) => (
          <ProductCard
            catalogHref={catalogHref}
            index={index}
            key={product.id}
            product={product}
          />
        ))}
      </div>

      {canLoadMore || hasLoadedAllProducts ? (
        <div className="catalog-load-more">
          {errorMessage ? (
            <p className="catalog-load-more__error" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <button
            aria-busy={isLoadingMore}
            aria-label={isLoadingMore ? "Cargando más productos" : undefined}
            className="button button--primary catalog-load-more__button"
            data-state={
              isLoadingMore
                ? "loading"
                : hasLoadedAllProducts
                  ? "complete"
                  : "idle"
            }
            disabled={isLoadingMore || hasLoadedAllProducts}
            onClick={loadMoreProducts}
            type="button"
          >
            {isLoadingMore ? (
              <span
                aria-hidden="true"
                className="catalog-load-more__spinner"
              />
            ) : hasLoadedAllProducts ? (
              "No hay más productos"
            ) : (
              "Ver más productos"
            )}
          </button>
        </div>
      ) : null}
    </>
  );
}

function createProductsApiHref(state: PublicCatalogState, page: number) {
  const params = new URLSearchParams();

  appendParam(params, "brand", state.brand);
  appendParam(params, "category", state.category);
  appendParam(params, "size", state.size);

  if (state.exclusive) {
    params.set("exclusivos", "1");
  }

  if (state.sort) {
    params.set("sort", state.sort);
  }

  params.set("page", String(page));

  return `/api/catalog/products?${params.toString()}`;
}

function appendParam(params: URLSearchParams, key: string, value: string) {
  const normalizedValue = value.trim();

  if (normalizedValue) {
    params.set(key, normalizedValue);
  }
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
