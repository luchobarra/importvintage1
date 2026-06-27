import { CatalogPagination } from "@/components/catalog/CatalogPagination";
import { EmptyCatalog } from "@/components/catalog/EmptyCatalog";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import {
  createPublicCatalogHref,
  emptyPublicCatalogState,
  hasPublicProductFilters,
  type PublicCatalogState,
} from "@/features/products/public-filters";
import { getAvailableProductsPage } from "@/features/products/queries";
import type { Product } from "@/features/products/types";
import Link from "next/link";

type ProductGridContainerProps = {
  state?: PublicCatalogState;
};

export async function ProductGridContainer({
  state = emptyPublicCatalogState,
}: ProductGridContainerProps) {
  let products: Product[] = [];
  let totalCount = 0;
  let errorMessage = "";
  const hasFilters = hasPublicProductFilters(state);
  const catalogHref = createPublicCatalogHref(state);

  try {
    const result = await getAvailableProductsPage(state);

    products = result.products;
    totalCount = result.totalCount;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "No se pudo conectar Supabase.";
  }

  if (errorMessage) {
    return (
      <EmptyCatalog
        isError
        title="Error de conexion"
        message={errorMessage}
      />
    );
  }

  if (products.length === 0) {
    if (hasFilters) {
      return (
        <>
          <EmptyCatalog
            title="No encontramos productos"
            message="Proba cambiar o limpiar los filtros."
          >
            <Link className="button button--primary" href="/">
              Limpiar filtros
            </Link>
          </EmptyCatalog>
        </>
      );
    }

    if (totalCount > 0 && state.page > 1) {
      return (
        <>
          <EmptyCatalog
            title="No hay productos en esta pagina"
            message="Volvé a la primera página o limpiá los filtros."
          >
            <Link
              className="button button--primary"
              href={createPublicCatalogHref(state, 1)}
            >
              Ver primera pagina
            </Link>
          </EmptyCatalog>
        </>
      );
    }

    return (
      <EmptyCatalog
        title="No hay prendas cargadas"
        message="La conexion con Supabase esta lista. Cuando carguemos productos desde el admin, van a aparecer en este catalogo."
      />
    );
  }

  return (
    <>
      <ProductGrid catalogHref={catalogHref} products={products} />
      <CatalogPagination state={state} totalCount={totalCount} />
    </>
  );
}
