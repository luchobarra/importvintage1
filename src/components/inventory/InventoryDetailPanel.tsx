import { InventoryItemActionsContainer } from "@/containers/inventory/InventoryItemActionsContainer";
import {
  formatInventoryCurrency,
  formatInventoryDate,
  formatInventoryDateTime,
  formatInventoryPercent,
  getInventoryStatusLabel,
} from "@/features/inventory/formatters";
import type {
  InventoryItem,
  InventoryMovement,
  SalesChannel,
} from "@/features/inventory/types";
import Image from "next/image";
import type { ReactNode } from "react";

type InventoryDetailPanelProps = {
  item: InventoryItem;
  salesChannels: SalesChannel[];
};

export function InventoryDetailPanel({
  item,
  salesChannels,
}: InventoryDetailPanelProps) {
  const catalogProduct = item.products?.[0];
  const isSold = item.status === "sold";
  const isReserved = item.status === "reserved";
  const salePrice = item.sale_price ?? item.estimated_sale_price;
  const estimatedProfit =
    typeof salePrice === "number" ? salePrice - item.purchase_price : null;
  const estimatedMargin =
    typeof estimatedProfit === "number" &&
    typeof salePrice === "number" &&
    salePrice > 0
      ? (estimatedProfit / salePrice) * 100
      : null;
  const movements = item.inventory_item_movements ?? [];

  return (
    <section className="inventory-detail">
      <div className="inventory-detail__media">
        <div className="inventory-detail__main-image">
          {item.inventory_item_images[0] ? (
            <Image
              alt={item.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 360px"
              src={item.inventory_item_images[0].image_url}
            />
          ) : (
            <span>Sin foto</span>
          )}
        </div>

        {item.inventory_item_images.length > 1 ? (
          <div className="inventory-detail__thumbs">
            {item.inventory_item_images.slice(1).map((image, index) => (
              <div className="inventory-detail__thumb" key={image.id}>
                <Image
                  alt={`${item.title} foto ${index + 2}`}
                  fill
                  sizes="96px"
                  src={image.image_url}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="inventory-detail__content">
        <div className="inventory-detail__head">
          <div>
            <p className="inventory-detail__id">ID {item.visible_id}</p>
            <h2>{item.title}</h2>
          </div>
          <div className="inventory-item__heading">
            <span
              className={`inventory-item__status inventory-item__status--${item.status}`}
            >
              {getInventoryStatusLabel(item.status)}
            </span>
            {catalogProduct ? (
              <span className="inventory-item__publish-badge">Publicado</span>
            ) : (
              <span className="inventory-item__publish-badge inventory-item__publish-badge--muted">
                Sin publicar
              </span>
            )}
          </div>
        </div>

        <div className="inventory-detail__metrics">
          <Metric
            label="Costo"
            value={formatInventoryCurrency(item.purchase_price)}
          />
          <Metric
            label={isSold ? "Venta real" : "Venta estimada"}
            value={formatInventoryCurrency(salePrice)}
          />
          <Metric
            label="Ganancia"
            value={formatInventoryCurrency(estimatedProfit)}
          />
          <Metric
            label="Margen"
            value={formatInventoryPercent(estimatedMargin)}
          />
        </div>

        <div className="inventory-detail__blocks">
          <DetailBlock title="Compra">
            <DetailItem
              label="Fecha"
              value={formatInventoryDate(item.purchase_date)}
            />
            <DetailItem
              label="Costo"
              value={formatInventoryCurrency(item.purchase_price)}
            />
            <DetailItem
              label="Categoria"
              value={item.catalog_categories?.name ?? "-"}
            />
            <DetailItem
              label="Marca"
              value={item.catalog_brands?.name ?? "-"}
            />
            <DetailItem
              label="Estado"
              value={item.catalog_product_conditions?.name ?? "-"}
            />
          </DetailBlock>

          <DetailBlock title="Catalogo">
            <DetailItem
              label="Publicacion"
              value={catalogProduct ? catalogProduct.title : "Sin publicar"}
            />
            <DetailItem
              label="Estado"
              value={catalogProduct ? catalogProduct.status : "-"}
            />
            <DetailItem
              label="ID stock"
              value={item.visible_id}
            />
          </DetailBlock>

          {isReserved || hasReservationData(item) ? (
            <DetailBlock title="Reserva">
              <DetailItem
                label="Fecha"
                value={formatInventoryDate(item.reserved_at)}
              />
              <DetailItem
                label="Canal"
                value={item.reservation_channels?.name ?? "Sin canal"}
              />
              <DetailItem
                label="Contacto"
                value={item.reservation_customer || "-"}
              />
              <DetailItem
                label="Vence"
                value={formatInventoryDate(item.reservation_expires_at)}
              />
              <DetailItem
                label="Notas"
                value={item.reservation_notes || "-"}
              />
            </DetailBlock>
          ) : null}

          {isSold ? (
            <DetailBlock title="Venta">
              <DetailItem
                label="Fecha"
                value={formatInventoryDate(item.sold_at)}
              />
              <DetailItem
                label="Canal"
                value={item.sales_channels?.name ?? "Sin canal"}
              />
              <DetailItem
                label="Precio"
                value={formatInventoryCurrency(item.sale_price)}
              />
              <DetailItem
                label="Notas"
                value={item.sale_notes || "-"}
              />
            </DetailBlock>
          ) : null}
        </div>

        <div className="inventory-detail__text-grid">
          <TextBlock
            label="Descripcion"
            value={item.internal_description || "Sin descripcion."}
          />
          <TextBlock label="Notas" value={item.internal_notes || "Sin notas."} />
        </div>

        <MovementHistory movements={movements} />

        <InventoryItemActionsContainer
          catalogProductId={catalogProduct?.id}
          estimatedSalePrice={item.estimated_sale_price}
          inventoryItemId={item.id}
          isReserved={isReserved}
          isSold={isSold}
          salesChannels={salesChannels}
          variant="detail"
        />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function DetailBlock({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <article className="inventory-detail__block">
      <h3>{title}</h3>
      <dl>{children}</dl>
    </article>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <article>
      <h3>{label}</h3>
      <p>{value}</p>
    </article>
  );
}

function MovementHistory({ movements }: { movements: InventoryMovement[] }) {
  return (
    <section className="inventory-history" aria-label="Historial de stock">
      <div className="inventory-history__head">
        <h3>Historial</h3>
        <span>{movements.length}</span>
      </div>
      {movements.length > 0 ? (
        <ol>
          {movements.map((movement) => (
            <li
              className={`inventory-history__item inventory-history__item--${movement.event_type}`}
              key={movement.id}
            >
              <div>
                <strong>{movement.title}</strong>
                <time dateTime={movement.created_at}>
                  {formatInventoryDateTime(movement.created_at)}
                </time>
              </div>
              {movement.notes ? <p>{movement.notes}</p> : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="inventory-history__empty">
          Todavia no hay movimientos registrados.
        </p>
      )}
    </section>
  );
}

function hasReservationData(item: InventoryItem) {
  return Boolean(
    item.reserved_at ||
      item.reservation_channel_id ||
      item.reservation_customer ||
      item.reservation_expires_at ||
      item.reservation_notes,
  );
}
