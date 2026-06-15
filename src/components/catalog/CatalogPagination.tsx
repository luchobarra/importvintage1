import type { PublicCatalogState } from "@/features/products/public-filters";
import {
  createPublicCatalogHref,
  PUBLIC_PRODUCTS_PAGE_SIZE,
} from "@/features/products/public-filters";
import Link from "next/link";

type CatalogPaginationProps = {
  state: PublicCatalogState;
  totalCount: number;
};

export function CatalogPagination({
  state,
  totalCount,
}: CatalogPaginationProps) {
  const totalPages = Math.ceil(totalCount / PUBLIC_PRODUCTS_PAGE_SIZE);

  if (totalPages <= 1) {
    return null;
  }

  const hasPreviousPage = state.page > 1;
  const hasNextPage = state.page < totalPages;

  return (
    <nav
      aria-label="Paginacion del catalogo"
      className="catalog-pagination"
    >
      {hasPreviousPage ? (
        <Link className="button" href={createPublicCatalogHref(state, state.page - 1)}>
          Anterior
        </Link>
      ) : (
        <span aria-disabled="true" className="button catalog-pagination__disabled">
          Anterior
        </span>
      )}

      <span className="catalog-pagination__status">
        Pagina {state.page} de {totalPages}
      </span>

      {hasNextPage ? (
        <Link className="button" href={createPublicCatalogHref(state, state.page + 1)}>
          Siguiente
        </Link>
      ) : (
        <span aria-disabled="true" className="button catalog-pagination__disabled">
          Siguiente
        </span>
      )}
    </nav>
  );
}
