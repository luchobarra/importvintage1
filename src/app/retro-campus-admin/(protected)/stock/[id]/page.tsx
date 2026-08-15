import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { InventoryDetailPanel } from "@/components/inventory/InventoryDetailPanel";
import { EmptyProductList } from "@/components/products/EmptyProductList";
import { InventoryFormContainer } from "@/containers/inventory/InventoryFormContainer";
import { getPublicCatalogOptions } from "@/features/catalog-options/queries";
import type {
  CatalogBrand,
  CatalogCategory,
  CatalogProductCondition,
} from "@/features/catalog-options/types";
import {
  getActiveSalesChannels,
  getInventoryItemById,
} from "@/features/inventory/queries";
import type { InventoryItem, SalesChannel } from "@/features/inventory/types";
import { getAdminPriceCalculatorSettings } from "@/features/price-calculator/queries";
import type { PriceCalculatorSettings } from "@/features/price-calculator/types";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Editar stock",
};

type EditInventoryItemPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditInventoryItemPage({
  params,
}: EditInventoryItemPageProps) {
  const { id } = await params;
  let brands: CatalogBrand[] = [];
  let categories: CatalogCategory[] = [];
  let conditions: CatalogProductCondition[] = [];
  let item: InventoryItem | null = null;
  let priceCalculatorSettings: PriceCalculatorSettings | null = null;
  let salesChannels: SalesChannel[] = [];
  let errorMessage = "";

  try {
    const [loadedItem, catalogOptions, settings, channels] = await Promise.all([
      getInventoryItemById(id),
      getPublicCatalogOptions(),
      getAdminPriceCalculatorSettings(),
      getActiveSalesChannels(),
    ]);
    item = loadedItem;
    brands = catalogOptions.brands;
    categories = catalogOptions.categories;
    conditions = catalogOptions.conditions;
    priceCalculatorSettings = settings;
    salesChannels = channels;
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo cargar el producto de stock.";
  }

  return (
    <AdminShell className="inventory-admin-shell">
      <AdminHeader
        actions={
          <Link className="button button--secondary" href="/retro-campus-admin/stock">
            Volver
          </Link>
        }
        description="Edita la información del producto. Las fotos se conservan para mantener trazabilidad."
        eyebrow="Stock"
        className="admin-header--inventory"
        title="Editar ingreso"
      />

      {item && priceCalculatorSettings ? (
        <>
          <InventoryDetailPanel item={item} salesChannels={salesChannels} />

          <div className="inventory-edit-heading">
            <h2>Editar datos</h2>
            <p>
              Actualiza la información interna del ingreso sin perder su
              historial.
            </p>
          </div>

          <section className="admin-form-panel">
            <InventoryFormContainer
              brands={brands}
              categories={categories}
              conditions={conditions}
              item={item}
              mode="edit"
              priceCalculatorSettings={priceCalculatorSettings}
            />
          </section>
        </>
      ) : (
        <EmptyProductList
          message={errorMessage}
          title="No se pudo cargar el ingreso"
        />
      )}
    </AdminShell>
  );
}
