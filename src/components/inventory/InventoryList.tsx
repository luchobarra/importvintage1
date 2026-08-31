import { InventoryListItem } from "@/components/inventory/InventoryListItem";
import type {
  InventoryItem,
  InventoryStatusFilter,
} from "@/features/inventory/types";

type InventoryListProps = {
  items: InventoryItem[];
  statusFilter?: InventoryStatusFilter;
};

export function InventoryList({
  items,
  statusFilter = "all",
}: InventoryListProps) {
  const valueColumnLabel = statusFilter === "sold" ? "Venta" : "Estimado";

  return (
    <div className="inventory-list">
      <div className="inventory-list__columns" aria-hidden="true">
        <span />
        <span>Producto</span>
        <span>Categoría</span>
        <span>Talle</span>
        <span>Marca</span>
        <span>Estado</span>
        <span>Compra</span>
        <span>Costo</span>
        <span>{valueColumnLabel}</span>
        <span />
      </div>
      {items.map((item) => (
        <InventoryListItem item={item} key={item.id} />
      ))}
    </div>
  );
}
