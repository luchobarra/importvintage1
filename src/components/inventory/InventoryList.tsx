import { InventoryListItem } from "@/components/inventory/InventoryListItem";
import type { InventoryItem } from "@/features/inventory/types";

type InventoryListProps = {
  items: InventoryItem[];
};

export function InventoryList({ items }: InventoryListProps) {
  return (
    <div className="inventory-list">
      <div className="inventory-list__columns" aria-hidden="true">
        <span />
        <span>Producto</span>
        <span>Categoria</span>
        <span>Marca</span>
        <span>Estado</span>
        <span>Compra</span>
        <span>Costo</span>
        <span>Estimado</span>
        <span />
      </div>
      {items.map((item) => (
        <InventoryListItem item={item} key={item.id} />
      ))}
    </div>
  );
}
