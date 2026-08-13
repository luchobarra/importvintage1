import { EmptyCatalog } from "@/components/catalog/EmptyCatalog";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import {
  createPublicCatalogHref,
  emptyPublicCatalogState,
  hasPublicCatalogControls,
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
  const hasActiveControls = hasPublicCatalogControls(state);
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
        title={
          state.exclusive ? "No pudimos cargar exclusivos" : "Error de conexion"
        }
        message={
          state.exclusive
            ? "Volve a intentar en unos minutos o consultanos por WhatsApp."
            : errorMessage
        }
      />
    );
  }

  if (products.length === 0) {
    if (state.exclusive) {
      return (
        <EmptyCatalog
          title="Todavia no hay exclusivos disponibles"
          message="Esta seleccion se actualiza cuando ingresan piezas especiales. Mientras tanto, podes ver el catalogo completo o consultarnos por WhatsApp."
        >
          <Link className="button button--primary" href="/">
            Ver catalogo completo
          </Link>
        </EmptyCatalog>
      );
    }

    if (hasActiveControls) {
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

    return (
      <EmptyCatalog
        title="No hay prendas cargadas"
        message="La conexion con Supabase esta lista. Cuando carguemos productos desde el admin, van a aparecer en este catalogo."
      />
    );
  }

  return (
    <ProductGrid
      catalogHref={catalogHref}
      initialState={state}
      key={catalogHref}
      products={products}
      totalCount={totalCount}
    />
  );
}
