import { CatalogOptionsManager } from "@/components/catalog-options/CatalogOptionsManager";
import { EmptyProductList } from "@/components/products/EmptyProductList";
import { getAdminCatalogOptions } from "@/features/catalog-options/queries";
import type { CatalogOptions } from "@/features/catalog-options/types";

export async function CatalogOptionsManagerContainer() {
  let options: CatalogOptions | null = null;
  let errorMessage = "";

  try {
    options = await getAdminCatalogOptions();
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudieron cargar las opciones.";
  }

  if (!options) {
    return (
      <EmptyProductList
        title="No se pudo cargar la configuración"
        message={errorMessage}
      />
    );
  }

  return <CatalogOptionsManager options={options} />;
}
