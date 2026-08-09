import { formatInventoryCurrency } from "@/features/inventory/formatters";
import type { InventoryItem } from "@/features/inventory/types";

type InventorySummaryProps = {
  items: InventoryItem[];
};

export function InventorySummary({ items }: InventorySummaryProps) {
  const availableCount = items.filter((item) => item.status === "available").length;
  const reservedCount = items.filter((item) => item.status === "reserved").length;
  const soldCount = items.filter((item) => item.status === "sold").length;
  const availableInvestment = items
    .filter((item) => item.status === "available" || item.status === "reserved")
    .reduce((total, item) => total + item.purchase_price, 0);

  return (
    <section className="inventory-summary" aria-label="Resumen de stock">
      <article>
        <span>Disponibles</span>
        <strong>{availableCount}</strong>
      </article>
      <article>
        <span>Reservados</span>
        <strong>{reservedCount}</strong>
      </article>
      <article>
        <span>Vendidos</span>
        <strong>{soldCount}</strong>
      </article>
      <article>
        <span>Inversion en stock</span>
        <strong>{formatInventoryCurrency(availableInvestment)}</strong>
      </article>
    </section>
  );
}
