"use client";

import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductCardSkeleton } from "@/components/catalog/ProductCardSkeleton";
import {
  PUBLIC_PRODUCTS_PAGE_SIZE,
  type PublicCatalogState,
} from "@/features/products/public-filters";
import type { Product } from "@/features/products/types";
import { useEffect, useRef, useState } from "react";

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

const LOAD_MORE_MIN_DELAY_MS = 260;
const LOAD_MORE_SKELETON_DELAY_MS = 520;

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
  const [showLoadingSkeletons, setShowLoadingSkeletons] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const skeletonTimeoutRef = useRef<number | null>(null);
  const canLoadMore =
    Boolean(initialState) && visibleProducts.length < availableProductCount;
  const remainingCount = Math.max(
    availableProductCount - visibleProducts.length,
    0,
  );
  const loadingSkeletonCount = Math.min(
    PUBLIC_PRODUCTS_PAGE_SIZE,
    Math.max(remainingCount, 1),
  );

  useEffect(() => {
    return () => {
      if (skeletonTimeoutRef.current !== null) {
        window.clearTimeout(skeletonTimeoutRef.current);
      }
    };
  }, []);

  async function loadMoreProducts() {
    if (!initialState || isLoadingMore || !canLoadMore) {
      return;
    }

    const nextPage = loadedPages + 1;

    setErrorMessage("");
    setIsLoadingMore(true);
    setShowLoadingSkeletons(false);

    skeletonTimeoutRef.current = window.setTimeout(() => {
      setShowLoadingSkeletons(true);
    }, LOAD_MORE_SKELETON_DELAY_MS);

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
        throw new Error("No se pudieron cargar mas productos.");
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
          : "No se pudieron cargar mas productos.",
      );
    } finally {
      if (skeletonTimeoutRef.current !== null) {
        window.clearTimeout(skeletonTimeoutRef.current);
        skeletonTimeoutRef.current = null;
      }

      setIsLoadingMore(false);
      setShowLoadingSkeletons(false);
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
        {showLoadingSkeletons
          ? Array.from({ length: loadingSkeletonCount }, (_, index) => (
              <ProductCardSkeleton key={`load-more-skeleton-${index}`} />
            ))
          : null}
      </div>

      {canLoadMore ? (
        <div className="catalog-load-more">
          {errorMessage ? (
            <p className="catalog-load-more__error" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <button
            aria-busy={isLoadingMore}
            className="button button--primary catalog-load-more__button"
            disabled={isLoadingMore}
            onClick={loadMoreProducts}
            type="button"
          >
            {isLoadingMore ? "Cargando..." : "Mas productos"}
          </button>
          <p className="catalog-load-more__status">
            Mostrando {visibleProducts.length} de {availableProductCount}
          </p>
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
