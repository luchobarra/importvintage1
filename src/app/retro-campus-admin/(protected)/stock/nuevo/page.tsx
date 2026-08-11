import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyProductList } from "@/components/products/EmptyProductList";
import { InventoryFormContainer } from "@/containers/inventory/InventoryFormContainer";
import { getPublicCatalogOptions } from "@/features/catalog-options/queries";
import type {
  CatalogBrand,
  CatalogCategory,
  CatalogProductCondition,
} from "@/features/catalog-options/types";
import { getAdminPriceCalculatorSettings } from "@/features/price-calculator/queries";
import type { PriceCalculatorSettings } from "@/features/price-calculator/types";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Nuevo ingreso de stock",
};

export default async function NewInventoryItemPage() {
  let brands: CatalogBrand[] = [];
  let categories: CatalogCategory[] = [];
  let conditions: CatalogProductCondition[] = [];
  let priceCalculatorSettings: PriceCalculatorSettings | null = null;
  let errorMessage = "";

  try {
    const [catalogOptions, settings] = await Promise.all([
      getPublicCatalogOptions(),
      getAdminPriceCalculatorSettings(),
    ]);
    brands = catalogOptions.brands;
    categories = catalogOptions.categories;
    conditions = catalogOptions.conditions;
    priceCalculatorSettings = settings;
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudieron cargar las categorias.";
  }

  return (
    <AdminShell>
      <AdminHeader
        actions={
          <Link className="button button--secondary" href="/retro-campus-admin/stock">
            Volver
          </Link>
        }
        description="Carga una prenda con fotos simples y datos utiles para seguimiento comercial."
        eyebrow="Stock"
        title="Nuevo ingreso"
      />

      <section className="admin-form-panel">
        {errorMessage || !priceCalculatorSettings ? (
          <EmptyProductList
            message={errorMessage}
            title="No se pudo cargar el formulario"
          />
        ) : (
          <InventoryFormContainer
            brands={brands}
            categories={categories}
            conditions={conditions}
            mode="create"
            priceCalculatorSettings={priceCalculatorSettings}
          />
        )}
      </section>
    </AdminShell>
  );
}
