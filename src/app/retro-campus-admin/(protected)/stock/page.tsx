import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventoryList } from "@/components/inventory/InventoryList";
import { InventorySectionHeader } from "@/components/inventory/InventorySectionHeader";
import { InventorySummary } from "@/components/inventory/InventorySummary";
import { EmptyProductList } from "@/components/products/EmptyProductList";
import { getPublicCatalogOptions } from "@/features/catalog-options/queries";
import type { CatalogOptions } from "@/features/catalog-options/types";
import {
  getInventoryItems,
  parseInventoryListFilters,
} from "@/features/inventory/queries";
import type {
  InventoryItem,
  InventoryListFilters,
  InventorySearchParams,
} from "@/features/inventory/types";
import type { Metadata } from "next";
import { BarChart3, Plus, Settings } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Stock",
};

type StockPageProps = {
  searchParams?: Promise<InventorySearchParams>;
};

export default async function StockPage({ searchParams }: StockPageProps) {
  const filters = parseInventoryListFilters(await searchParams);
  let errorMessage = "";
  let options: CatalogOptions | null = null;
  let items: InventoryItem[] = [];
  let summaryItems: InventoryItem[] = [];

  try {
    [items, summaryItems, options] = await Promise.all([
      getInventoryItems(filters),
      getInventoryItems(getInventorySummaryFilters()),
      getPublicCatalogOptions(),
    ]);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "No se pudo cargar el stock.";
  }

  return (
    <AdminShell className="inventory-admin-shell">
      <AdminHeader
        actions={
          <div className="admin-header__actions">
            <Link className="button button--secondary" href="/retro-campus-admin/stock/canales">
              <Settings aria-hidden="true" size={16} />
              Canales
            </Link>
            <Link className="button button--secondary" href="/retro-campus-admin">
              <BarChart3 aria-hidden="true" size={16} />
              Panel
            </Link>
            <Link className="button button--primary" href="/retro-campus-admin/stock/nuevo">
              <Plus aria-hidden="true" size={16} />
              Nuevo ingreso
            </Link>
          </div>
        }
        description="Control de prendas compradas, disponibles, vendidas y publicadas en catalogo."
        eyebrow="Inventario"
        className="admin-header--inventory"
        title="Stock"
      />

      {errorMessage ? (
        <EmptyProductList
          message={errorMessage}
          title="No se pudo cargar el stock"
        />
      ) : (
        <>
          <InventorySummary items={summaryItems} />
          {options ? (
            <InventoryFilters filters={filters} options={options} />
          ) : null}
          {options ? (
            <InventorySectionHeader
              filters={filters}
              itemCount={items.length}
              options={options}
            />
          ) : null}
          {items.length > 0 ? (
            <InventoryList items={items} />
          ) : (
            <EmptyProductList
              message="Carga un nuevo ingreso o ajusta los filtros para ver otros productos."
              title="No hay productos de stock"
            />
          )}
        </>
      )}
    </AdminShell>
  );
}

function getInventorySummaryFilters(): InventoryListFilters {
  return {
    brandId: "",
    categoryId: "",
    conditionId: "",
    costMax: "",
    costMin: "",
    published: "all",
    purchaseDate: "",
    query: "",
    sort: "newest",
    status: "all",
    valueType: "purchase",
  };
}
