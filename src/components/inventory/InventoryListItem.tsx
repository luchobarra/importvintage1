import {
  formatInventoryCurrency,
  formatInventoryDate,
  getInventoryStatusLabel,
} from "@/features/inventory/formatters";
import type { InventoryItem } from "@/features/inventory/types";
import { Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type InventoryListItemProps = {
  item: InventoryItem;
};

export function InventoryListItem({ item }: InventoryListItemProps) {
  const mainImage = item.inventory_item_images[0];
  const isSold = item.status === "sold";
  const salePriceLabel = isSold ? "Venta" : "Estimado";
  const salePrice = isSold ? item.sale_price : item.estimated_sale_price;

  return (
    <article className="inventory-item">
      <span
        aria-label={getInventoryStatusLabel(item.status)}
        className={`inventory-item__status-rail inventory-item__status-rail--${item.status}`}
        title={getInventoryStatusLabel(item.status)}
      />

      <div className="inventory-item__image">
        {mainImage ? (
          <Image
            alt={item.title}
            fill
            sizes="64px"
            src={mainImage.image_url}
          />
        ) : (
          <span>Sin foto</span>
        )}
      </div>

      <div className="inventory-item__content">
        <div className="inventory-item__title-block">
          <p className="inventory-item__id">{item.visible_id}</p>
          <h2>
            <Link href={`/retro-campus-admin/stock/${item.id}`}>
              {item.title}
            </Link>
          </h2>
        </div>

        <dl className="inventory-item__data">
          <div>
            <dt>Categoría</dt>
            <dd>{item.catalog_categories?.name ?? "-"}</dd>
          </div>
          <div>
            <dt>Marca</dt>
            <dd>{item.catalog_brands?.name ?? "-"}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{item.catalog_product_conditions?.name ?? "-"}</dd>
          </div>
          <div>
            <dt>Compra</dt>
            <dd>{formatInventoryDate(item.purchase_date)}</dd>
          </div>
          <div>
            <dt>Costo</dt>
            <dd>{formatInventoryCurrency(item.purchase_price)}</dd>
          </div>
          <div>
            <dt>{salePriceLabel}</dt>
            <dd>{formatInventoryCurrency(salePrice)}</dd>
          </div>
        </dl>
      </div>

      <Link
        aria-label={`Ver detalle de ${item.title}`}
        className="inventory-item__detail-button"
        href={`/retro-campus-admin/stock/${item.id}`}
        title="Ver detalle"
      >
        <Eye aria-hidden="true" size={18} />
      </Link>
    </article>
  );
}
