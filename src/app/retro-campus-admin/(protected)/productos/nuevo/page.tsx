import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyProductList } from "@/components/products/EmptyProductList";
import { ProductFormContainer } from "@/containers/products/ProductFormContainer";
import { getPublicCatalogOptions } from "@/features/catalog-options/queries";
import type { CatalogOptions } from "@/features/catalog-options/types";
import { getInventoryItemById } from "@/features/inventory/queries";
import type { InventoryItem } from "@/features/inventory/types";
import { getAdminPriceCalculatorSettings } from "@/features/price-calculator/queries";
import type { PriceCalculatorSettings } from "@/features/price-calculator/types";

type NewProductPageProps = {
  searchParams?: Promise<{
    inventoryItemId?: string;
  }>;
};

export default async function NewProductPage({
  searchParams,
}: NewProductPageProps) {
  const resolvedSearchParams = await searchParams;
  const inventoryItemId = String(resolvedSearchParams?.inventoryItemId ?? "");
  let options: CatalogOptions | null = null;
  let inventoryItem: InventoryItem | null = null;
  let priceCalculatorSettings: PriceCalculatorSettings | null = null;
  let errorMessage = "";

  try {
    [options, inventoryItem, priceCalculatorSettings] = await Promise.all([
      getPublicCatalogOptions(),
      inventoryItemId ? getInventoryItemById(inventoryItemId) : null,
      getAdminPriceCalculatorSettings(),
    ]);
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudieron cargar las opciones del catálogo.";
  }

  const inventoryPublishError =
    inventoryItem?.status === "sold"
      ? "Este ingreso ya fue marcado como vendido y no puede publicarse en el catálogo."
      : "";

  return (
    <AdminShell>
      <AdminHeader
        eyebrow="Operación / Nuevo producto"
        title="Nuevo producto"
        description={
          inventoryItem
            ? "Publica este ingreso de stock en el catálogo con fotos y datos comerciales cuidados."
            : "Carga la información de la prenda y entre 1 y 5 fotos. La primera imagen se usa como foto principal."
        }
      />

      <section className="admin-form-panel">
        {options && priceCalculatorSettings && !inventoryPublishError ? (
          <ProductFormContainer
            initialValues={
              inventoryItem
                ? {
                    brandId: inventoryItem.brand_id,
                    categoryId: inventoryItem.category_id,
                    conditionId: inventoryItem.condition_id,
                    description:
                      inventoryItem.internal_description ?? "",
                    heightCm: inventoryItem.height_cm,
                    inventoryItemId: inventoryItem.id,
                    price: inventoryItem.estimated_sale_price,
                    sizeId: inventoryItem.size_id,
                    title: inventoryItem.title,
                    widthCm: inventoryItem.width_cm,
                  }
                : undefined
            }
            options={options}
            priceCalculatorSettings={priceCalculatorSettings}
          />
        ) : (
          <EmptyProductList
            title="No se pudo cargar el formulario"
            message={inventoryPublishError || errorMessage}
          />
        )}
      </section>
    </AdminShell>
  );
}
