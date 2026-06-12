import { EmptyCatalog } from "@/components/catalog/EmptyCatalog";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { getAvailableProducts } from "@/features/products/queries";
import type { Product } from "@/features/products/types";

export async function ProductGridContainer() {
  let products: Product[] = [];
  let errorMessage = "";

  try {
    products = await getAvailableProducts();
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
    return (
      <EmptyCatalog
        title="No hay prendas cargadas"
        message="La conexion con Supabase esta lista. Cuando carguemos productos desde el admin, van a aparecer en este catalogo."
      />
    );
  }

  return <ProductGrid products={products} />;
}

