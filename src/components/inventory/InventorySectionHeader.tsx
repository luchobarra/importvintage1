import type { CatalogOptions } from "@/features/catalog-options/types";
import {
  formatInventoryCurrency,
  formatInventoryDate,
} from "@/features/inventory/formatters";
import type { InventoryListFilters } from "@/features/inventory/types";

type InventorySectionHeaderProps = {
  filters: InventoryListFilters;
  itemCount: number;
  options: CatalogOptions;
};

export function InventorySectionHeader({
  filters,
  itemCount,
  options,
}: InventorySectionHeaderProps) {
  const activeFilters = getActiveFilterLabels(filters, options);

  return (
    <section className="inventory-section-header">
      <div>
        <p>Listado de stock</p>
        <h2>{getInventorySectionTitle(filters)}</h2>
      </div>
      <div className="inventory-section-header__meta">
        <span>
          {itemCount} {itemCount === 1 ? "producto" : "productos"}
        </span>
        {activeFilters.length > 0 ? (
          <small>{activeFilters.join(" · ")}</small>
        ) : null}
      </div>
    </section>
  );
}

function getInventorySectionTitle(filters: InventoryListFilters) {
  if (filters.purchaseDate) {
    return `Comprados el ${formatInventoryDate(filters.purchaseDate)}`;
  }

  if (filters.status === "all") {
    return "Todos los productos";
  }

  if (filters.status === "available") {
    return "Disponibles";
  }

  if (filters.status === "reserved") {
    return "Reservados";
  }

  return "Vendidos";
}

function getActiveFilterLabels(
  filters: InventoryListFilters,
  options: CatalogOptions,
) {
  const labels = [];
  const brand = options.brands.find((option) => option.id === filters.brandId);
  const category = options.categories.find(
    (option) => option.id === filters.categoryId,
  );
  const condition = options.conditions.find(
    (option) => option.id === filters.conditionId,
  );

  if (filters.query) {
    labels.push(`Busqueda: ${filters.query}`);
  }

  if (brand) {
    labels.push(`Marca: ${brand.name}`);
  }

  if (category) {
    labels.push(`Categoría: ${category.name}`);
  }

  if (condition) {
    labels.push(`Estado: ${condition.name}`);
  }

  if (filters.published === "published") {
    labels.push("Publicado en catálogo");
  }

  if (filters.published === "unpublished") {
    labels.push("Sin publicar");
  }

  if (filters.costMin) {
    labels.push(
      `${getValueTypeLabel(filters.valueType)} desde ${formatInventoryCurrency(Number(normalizeCost(filters.costMin)))}`,
    );
  }

  if (filters.costMax) {
    labels.push(
      `${getValueTypeLabel(filters.valueType)} hasta ${formatInventoryCurrency(Number(normalizeCost(filters.costMax)))}`,
    );
  }

  labels.push(getSortLabel(filters.sort));

  return labels;
}

function getSortLabel(sort: InventoryListFilters["sort"]) {
  if (sort === "oldest") {
    return "Más antiguos";
  }

  if (sort === "cost_desc") {
    return "Mayor costo";
  }

  if (sort === "cost_asc") {
    return "Menor costo";
  }

  if (sort === "estimated_desc") {
    return "Mayor estimado";
  }

  if (sort === "estimated_asc") {
    return "Menor estimado";
  }

  if (sort === "sale_desc") {
    return "Mayor venta real";
  }

  if (sort === "sale_asc") {
    return "Menor venta real";
  }

  return "Más recientes";
}

function normalizeCost(value: string) {
  return value.replace(/\D/g, "");
}

function getValueTypeLabel(valueType: InventoryListFilters["valueType"]) {
  if (valueType === "estimated") {
    return "Estimado";
  }

  if (valueType === "sale") {
    return "Venta real";
  }

  return "Costo";
}
