import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyProductList } from "@/components/products/EmptyProductList";
import { ProductFormContainer } from "@/containers/products/ProductFormContainer";
import { getPublicCatalogOptions } from "@/features/catalog-options/queries";
import type { CatalogOptions } from "@/features/catalog-options/types";
import { getInventoryItemById } from "@/features/inventory/queries";
import type { InventoryItem } from "@/features/inventory/types";
import Link from "next/link";

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
  let errorMessage = "";

  try {
    [options, inventoryItem] = await Promise.all([
      getPublicCatalogOptions(),
      inventoryItemId ? getInventoryItemById(inventoryItemId) : null,
    ]);
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudieron cargar las opciones del catalogo.";
  }

  return (
    <AdminShell>
      <AdminHeader
        eyebrow="Productos"
        title="Nuevo producto"
        description={
          inventoryItem
            ? "Publica este ingreso de stock en el catalogo con fotos y datos comerciales cuidados."
            : "Carga la informacion de la prenda y entre 1 y 5 fotos. La primera imagen se usa como foto principal."
        }
        actions={
          <Link className="button" href="/retro-campus-admin">
            Volver
          </Link>
        }
      />

      <section className="admin-form-panel">
        {options ? (
          <ProductFormContainer
            initialValues={
              inventoryItem
                ? {
                    brandId: inventoryItem.brand_id,
                    categoryId: inventoryItem.category_id,
                    conditionId: inventoryItem.condition_id,
                    description:
                      inventoryItem.internal_description ?? "",
                    inventoryItemId: inventoryItem.id,
                    price: inventoryItem.estimated_sale_price,
                    title: inventoryItem.title,
                  }
                : undefined
            }
            options={options}
          />
        ) : (
          <EmptyProductList
            title="No se pudo cargar el formulario"
            message={errorMessage}
          />
        )}
      </section>
    </AdminShell>
  );
}
