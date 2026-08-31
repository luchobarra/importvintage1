import { InventoryItemActionsContainer } from "@/containers/inventory/InventoryItemActionsContainer";
import { InventorySaleEditContainer } from "@/containers/inventory/InventorySaleEditContainer";
import {
  formatInventoryAgeDays,
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
  const ageLabel = formatInventoryAgeDays(item.purchase_date, item.sold_at);
  const saleStatusLabel = isSold ? "Venta cerrada" : isReserved ? "Reservado" : "Listo para operar";

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
            <p className="inventory-detail__subline">
              {item.catalog_categories?.name ?? "Sin categoría"} ·{" "}
              {item.catalog_sizes?.label ?? "Sin talle"} ·{" "}
              {item.catalog_brands?.name ?? "Sin marca"} ·{" "}
              {item.catalog_product_conditions?.name ?? "Sin estado"}
            </p>
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

        <section className="inventory-detail__summary" aria-label="Resumen financiero">
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
          <Metric
            label="En stock"
            value={ageLabel}
          />
        </section>

        <section className="inventory-detail__status-panel">
          <div className="inventory-detail__section-head">
            <div>
              <h3>Estado operativo</h3>
              <p>Situación actual del ingreso para operar sin revisar toda la ficha.</p>
            </div>
            <span>{saleStatusLabel}</span>
          </div>

          <div className="inventory-detail__status-grid">
            <StatusFact
              label="Disponibilidad"
              value={getInventoryStatusLabel(item.status)}
            />
            <StatusFact
              label="Publicación"
              value={catalogProduct ? "Publicado" : "Sin publicar"}
            />
            <StatusFact
              label="Fecha de compra"
              value={formatInventoryDate(item.purchase_date)}
            />
            <StatusFact
              label="Última actualización"
              value={formatInventoryDateTime(item.updated_at)}
            />
          </div>

          {isReserved || hasReservationData(item) ? (
            <div className="inventory-detail__event-card">
              <h4>Reserva</h4>
              <dl>
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
              </dl>
              {item.reservation_notes ? <p>{item.reservation_notes}</p> : null}
            </div>
          ) : null}

          {isSold ? (
            <div className="inventory-detail__event-card inventory-detail__event-card--sold">
              <div className="inventory-detail__event-card-head">
                <h4>Venta cerrada</h4>
                <InventorySaleEditContainer
                  inventoryItemId={item.id}
                  saleAt={item.sold_at}
                  saleChannelId={item.sale_channel_id}
                  saleNotes={item.sale_notes}
                  salePrice={item.sale_price}
                  salesChannels={salesChannels}
                />
              </div>
              <dl>
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
              </dl>
              {item.sale_notes ? <p>{item.sale_notes}</p> : null}
            </div>
          ) : null}
        </section>

        <div className="inventory-detail__notes-grid">
          <TextBlock
            label="Descripción"
            value={item.internal_description || "Sin descripción."}
          />
          <TextBlock
            label="Notas"
            value={item.internal_notes || "Sin notas."}
          />
        </div>

        <section className="inventory-detail__extended" aria-label="Información extendida">
          <div className="inventory-detail__section-head">
            <div>
              <h3>Información extendida</h3>
              <p>Datos administrativos y de trazabilidad del ingreso.</p>
            </div>
          </div>

          <div className="inventory-detail__blocks">
            <DetailBlock title="Producto">
              <DetailItem
                label="Categoría"
                value={item.catalog_categories?.name ?? "-"}
              />
              <DetailItem
                label="Talle"
                value={item.catalog_sizes?.label ?? "-"}
              />
              <DetailItem
                label="Marca"
                value={item.catalog_brands?.name ?? "-"}
              />
              <DetailItem
                label="Estado"
                value={item.catalog_product_conditions?.name ?? "-"}
              />
              <DetailItem
                label="ID stock"
                value={item.visible_id}
              />
            </DetailBlock>

            <DetailBlock title="Compra">
              <DetailItem
                label="Fecha"
                value={formatInventoryDate(item.purchase_date)}
              />
              <DetailItem
                label="Costo"
                value={formatInventoryCurrency(item.purchase_price)}
              />
            </DetailBlock>

            <DetailBlock title="Catálogo">
              <DetailItem
                label="Publicación"
                value={catalogProduct ? catalogProduct.title : "Sin publicar"}
              />
              <DetailItem
                label="Estado"
                value={catalogProduct ? catalogProduct.status : "-"}
              />
            </DetailBlock>
          </div>
        </section>

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

function StatusFact({ label, value }: { label: string; value: string }) {
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
          Todavía no hay movimientos registrados.
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
