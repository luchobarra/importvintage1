import { EmptyProductList } from "@/components/products/EmptyProductList";
import { ProductSearchContainer } from "@/containers/products/ProductSearchContainer";
import { getAdminProducts } from "@/features/products/queries";
import type { Product } from "@/features/products/types";

export async function ProductListContainer() {
  let products: Product[] = [];
  let errorMessage = "";

  try {
    products = await getAdminProducts();
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "No se pudieron cargar productos.";
  }

  if (errorMessage) {
    return (
      <EmptyProductList
        title="Error al cargar productos"
        message={errorMessage}
      />
    );
  }

  if (products.length === 0) {
    return (
      <EmptyProductList
        title="Todavia no hay productos"
        message="Cuando cargues prendas desde el admin, van a aparecer aca."
      />
    );
  }

  return <ProductSearchContainer products={products} />;
}

