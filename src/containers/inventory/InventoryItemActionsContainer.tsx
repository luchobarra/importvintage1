"use client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DatePicker } from "@/components/ui/DatePicker";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import {
  ResultModal,
  type ResultModalVariant,
} from "@/components/ui/ResultModal";
import {
  deleteInventoryItem,
  markInventoryItemAsSold,
  setInventoryItemReserved,
} from "@/features/inventory/actions";
import {
  formatInventoryCurrency,
  getTodayDateInputValue,
} from "@/features/inventory/formatters";
import type { SalesChannel } from "@/features/inventory/types";
import {
  normalizeMoneyInput,
  validateInventorySaleFormFields,
  type InventorySaleFieldErrors,
} from "@/features/inventory/validation";
import { formatProductPriceInput } from "@/features/products/form-validation";
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  PackagePlus,
  ReceiptText,
  Timer,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";
import { useRef, useState, useTransition } from "react";

type InventoryItemActionsContainerProps = {
  catalogProductId?: string;
  estimatedSalePrice: number | null;
  inventoryItemId: string;
  isReserved?: boolean;
  isSold: boolean;
  salesChannels: SalesChannel[];
  variant?: "detail" | "list";
};

type ResultState = {
  description: string;
  title: string;
  variant: ResultModalVariant;
};

export function InventoryItemActionsContainer({
  catalogProductId,
  estimatedSalePrice,
  inventoryItemId,
  isReserved = false,
  isSold,
  salesChannels,
  variant = "list",
}: InventoryItemActionsContainerProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const reservationFormRef = useRef<HTMLFormElement>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [reservationConfirmValue, setReservationConfirmValue] = useState<
    boolean | null
  >(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [pendingReservationFormData, setPendingReservationFormData] =
    useState<FormData | null>(null);
  const [pendingReservationMode, setPendingReservationMode] = useState<
    boolean | null
  >(null);
  const [pendingSaleFormData, setPendingSaleFormData] = useState<FormData | null>(
    null,
  );
  const [fieldErrors, setFieldErrors] = useState<InventorySaleFieldErrors>({});
  const [message, setMessage] = useState("");
  const [pendingMessage, setPendingMessage] = useState("Procesando...");
  const [result, setResult] = useState<ResultState | null>(null);
  const [isPending, startTransition] = useTransition();
  const isPublished = Boolean(catalogProductId);
  const defaultSaleChannelId =
    (catalogProductId && salesChannels.find((channel) => channel.slug === "catalogo")?.id) ||
    "";

  function handleSaleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const form = formRef.current;

    if (!form) {
      return;
    }

    const formData = new FormData(form);
    const validation = validateInventorySaleFormFields(formData);

    setFieldErrors(validation.errors);

    if (validation.firstInvalidField) {
      setMessage(validation.message);
      focusSaleField(form, validation.firstInvalidField);
      return;
    }

    formData.set("sale_price", normalizeMoneyInput(formData.get("sale_price")));
    setPendingSaleFormData(formData);
  }

  function handleConfirmSale() {
    if (isPending || !pendingSaleFormData) {
      return;
    }

    const formData = pendingSaleFormData;

    setPendingSaleFormData(null);
    setPendingMessage("Registrando venta...");

    startTransition(async () => {
      const actionResult = await markInventoryItemAsSold(
        inventoryItemId,
        formData,
      );

      setResult({
        description: actionResult.message,
        title: actionResult.success ? "Venta registrada" : "No se pudo vender",
        variant: actionResult.success ? "success" : "error",
      });

      if (actionResult.success) {
        setIsSaleModalOpen(false);
        router.refresh();
      } else {
        setMessage(actionResult.message);
      }
    });
  }

  function handleConfirmDelete() {
    if (isPending) {
      return;
    }

    setIsDeleteConfirmOpen(false);
    setPendingMessage("Eliminando ingreso...");
    setResult(null);

    startTransition(async () => {
      const actionResult = await deleteInventoryItem(inventoryItemId);

      setResult({
        description: actionResult.success
          ? "El ingreso y sus fotos se eliminaron correctamente del stock."
          : actionResult.message,
        title: actionResult.success
          ? "Ingreso eliminado"
          : "No se pudo eliminar",
        variant: actionResult.success ? "success" : "error",
      });

      if (actionResult.success) {
        router.refresh();
      }
    });
  }

  function handleReservationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending || reservationConfirmValue === null) {
      return;
    }

    const form = reservationFormRef.current;

    if (!form) {
      return;
    }

    const nextReservedValue = reservationConfirmValue;
    const formData = new FormData(form);

    formData.set("reserve_mode", nextReservedValue ? "reserved" : "available");

    setPendingReservationFormData(formData);
    setPendingReservationMode(nextReservedValue);
  }

  function handleConfirmReservation() {
    if (
      isPending ||
      pendingReservationFormData === null ||
      pendingReservationMode === null
    ) {
      return;
    }

    const formData = pendingReservationFormData;
    const nextReservedValue = pendingReservationMode;

    setPendingReservationFormData(null);
    setPendingReservationMode(null);
    setReservationConfirmValue(null);
    setPendingMessage(
      nextReservedValue
        ? "Marcando como reservado..."
        : "Marcando como disponible...",
    );
    setResult(null);

    startTransition(async () => {
      const actionResult = await setInventoryItemReserved(
        inventoryItemId,
        formData,
      );

      setResult({
        description: actionResult.message,
        title: actionResult.success ? "Estado actualizado" : "No se pudo actualizar",
        variant: actionResult.success ? "success" : "error",
      });

      if (actionResult.success) {
        router.refresh();
      }
    });
  }

  function handlePriceChange(event: ChangeEvent<HTMLInputElement>) {
    event.target.value = formatProductPriceInput(event.target.value);
    clearFieldError(event.currentTarget.name);
  }

  function closeSaleModal() {
    if (isPending) {
      return;
    }

    setIsSaleModalOpen(false);
    setPendingSaleFormData(null);
    setFieldErrors({});
    setMessage("");
  }

  function closeReservationModal() {
    if (isPending) {
      return;
    }

    setReservationConfirmValue(null);
    setPendingReservationFormData(null);
    setPendingReservationMode(null);
  }

  return (
    <>
      <div
        className={`inventory-item__actions inventory-item__actions--${variant}`}
      >
        {variant === "list" ? (
          <Link
            className="button button--primary"
            href={`/retro-campus-admin/stock/${inventoryItemId}`}
          >
            <Eye aria-hidden="true" size={15} />
            Ver detalle
          </Link>
        ) : null}
        {catalogProductId ? (
          <Link
            className="button button--secondary"
            href={`/retro-campus-admin/productos/${catalogProductId}`}
          >
            <ExternalLink aria-hidden="true" size={15} />
            Ver catálogo
          </Link>
        ) : isSold ? (
          <button
            className="button button--secondary"
            disabled
            title="Un producto vendido no se puede publicar en el catálogo."
            type="button"
          >
            <PackagePlus aria-hidden="true" size={15} />
            Publicar
          </button>
        ) : (
          <Link
            className="button button--secondary"
            href={`/retro-campus-admin/productos/nuevo?inventoryItemId=${inventoryItemId}`}
          >
            <PackagePlus aria-hidden="true" size={15} />
            Publicar
          </Link>
        )}
        {!isSold ? (
          <button
            className="button button--secondary"
            disabled={isPending}
            onClick={() => setReservationConfirmValue(!isReserved)}
            type="button"
          >
            {isReserved ? (
              <CheckCircle2 aria-hidden="true" size={15} />
            ) : (
              <Timer aria-hidden="true" size={15} />
            )}
            {isReserved ? "Marcar disponible" : "Reservar"}
          </button>
        ) : null}
        {!isSold ? (
          <button
            className="button button--primary"
            disabled={isPending}
            onClick={() => setIsSaleModalOpen(true)}
            type="button"
          >
            <ReceiptText aria-hidden="true" size={15} />
            Marcar vendido
          </button>
        ) : null}
        <button
          className="button button--secondary button--danger"
          aria-label={
            isPublished
              ? "No se puede eliminar un ingreso publicado"
              : "Eliminar ingreso"
          }
          disabled={isPending || isPublished}
          onClick={() => setIsDeleteConfirmOpen(true)}
          title={
            isPublished
              ? "Primero elimina o actualiza la publicación vinculada."
              : "Eliminar ingreso"
          }
          type="button"
        >
          <Trash2 aria-hidden="true" size={15} />
          Eliminar
        </button>
      </div>

      {isSaleModalOpen ? (
        <div className="confirm-dialog" role="presentation">
          <button
            aria-label="Cerrar registro de venta"
            className="confirm-dialog__backdrop"
            disabled={isPending}
            onClick={closeSaleModal}
            type="button"
          />
          <form
            aria-modal="true"
            className="confirm-dialog__panel inventory-sale-modal"
            onSubmit={handleSaleSubmit}
            ref={formRef}
            role="dialog"
          >
            <ModalHeader
              eyebrow="Venta"
              title="Registrar venta"
              description="Confirmá los datos comerciales para cerrar el ingreso y alimentar las métricas del negocio."
            />

            <div className="inventory-action-modal__notice">
              <strong>Al confirmar</strong>
              <span>
                El producto pasa a vendido, se libera cualquier reserva y se retira del catálogo si estaba publicado.
              </span>
            </div>

            <section className="inventory-action-modal__section">
              <div className="inventory-action-modal__section-head">
                <h3>Datos de venta</h3>
                <p>Estos campos impactan en ganancia, margen y reportes.</p>
              </div>

              <div className="inventory-action-modal__fields inventory-action-modal__fields--sale">
                <label
                  className={getSaleFieldClassName(fieldErrors.sold_at)}
                  htmlFor={`sold_at-${inventoryItemId}`}
                >
                  <FieldLabel error={fieldErrors.sold_at} label="Fecha" />
                  <DatePicker
                    defaultValue={getTodayDateInputValue()}
                    id={`sold_at-${inventoryItemId}`}
                    name="sold_at"
                    onChange={clearFieldError}
                    required
                  />
                </label>

                <label
                  className={getSaleFieldClassName(fieldErrors.sale_price)}
                  htmlFor={`sale_price-${inventoryItemId}`}
                >
                  <FieldLabel
                    error={fieldErrors.sale_price}
                    label="Precio real"
                  />
                  <input
                    defaultValue={getSalePriceInputDefaultValue(
                      estimatedSalePrice,
                    )}
                    id={`sale_price-${inventoryItemId}`}
                    inputMode="numeric"
                    name="sale_price"
                    onChange={handlePriceChange}
                    placeholder={formatInventoryCurrency(estimatedSalePrice)}
                    required
                    type="text"
                  />
                </label>

                <label
                  className={getSaleFieldClassName(fieldErrors.sale_channel_id)}
                  htmlFor={`sale_channel_id-${inventoryItemId}`}
                >
                  <FieldLabel
                    error={fieldErrors.sale_channel_id}
                    label="Canal"
                  />
                  <select
                    defaultValue={defaultSaleChannelId}
                    id={`sale_channel_id-${inventoryItemId}`}
                    name="sale_channel_id"
                    onChange={(event) => clearFieldError(event.currentTarget.name)}
                    required
                  >
                    <option value="">Seleccionar canal</option>
                    {salesChannels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="inventory-action-modal__section inventory-action-modal__section--secondary">
              <label
                className={getSaleFieldClassName(fieldErrors.sale_notes)}
                htmlFor={`sale_notes-${inventoryItemId}`}
              >
                <FieldLabel error={fieldErrors.sale_notes} label="Notas" />
                <textarea
                  id={`sale_notes-${inventoryItemId}`}
                  name="sale_notes"
                  onChange={(event) => clearFieldError(event.currentTarget.name)}
                  placeholder="Detalle del pago, envío, acuerdo o aclaración interna."
                  rows={3}
                />
              </label>
            </section>

            {message ? (
              <p aria-live="polite" className="auth-form__error">
                {message}
              </p>
            ) : null}

            <div className="confirm-dialog__actions">
              <button
                className="button button--secondary"
                disabled={isPending}
                onClick={closeSaleModal}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="button button--primary"
                disabled={isPending}
                type="submit"
              >
                Registrar venta
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel="Confirmar venta"
        description="Se marcará este producto como vendido, se guardarán los datos comerciales cargados y dejará de estar disponible para la venta."
        isOpen={pendingSaleFormData !== null}
        isPending={isPending}
        onCancel={() => setPendingSaleFormData(null)}
        onConfirm={handleConfirmSale}
        title="Confirmar venta"
      />

      <ConfirmDialog
        confirmLabel="Eliminar ingreso"
        description="Se eliminará este ingreso de stock y sus fotos. Si tenía una publicación en catálogo, la publicación no se elimina, pero queda desvinculada."
        isOpen={isDeleteConfirmOpen}
        isPending={isPending}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar ingreso"
        variant="danger"
      />
      {reservationConfirmValue !== null ? (
        <div className="confirm-dialog" role="presentation">
          <button
            aria-label="Cerrar reserva"
            className="confirm-dialog__backdrop"
            disabled={isPending}
            onClick={closeReservationModal}
            type="button"
          />
          <form
            aria-modal="true"
            className="confirm-dialog__panel inventory-sale-modal"
            onSubmit={handleReservationSubmit}
            ref={reservationFormRef}
            role="dialog"
          >
            <ModalHeader
              eyebrow={reservationConfirmValue ? "Reserva" : "Disponibilidad"}
              title={reservationConfirmValue ? "Reservar producto" : "Marcar disponible"}
              description={
                reservationConfirmValue
                  ? "Registrá la reserva para que el equipo sepa quién la pidió, por dónde llegó y hasta cuándo sostenerla."
                  : "La reserva se elimina y el producto vuelve a estar disponible para venta."
              }
            />

            {reservationConfirmValue ? (
              <>
                <section className="inventory-action-modal__section">
                  <div className="inventory-action-modal__section-head">
                    <h3>Datos de reserva</h3>
                    <p>Fecha obligatoria; el resto ayuda a mantener trazabilidad.</p>
                  </div>

                  <div className="inventory-action-modal__fields inventory-action-modal__fields--reservation">
                    <label
                      className="form-field"
                      htmlFor={`reserved_at-${inventoryItemId}`}
                    >
                      <FieldLabel label="Fecha" />
                      <DatePicker
                        defaultValue={getTodayDateInputValue()}
                        id={`reserved_at-${inventoryItemId}`}
                        name="reserved_at"
                        required
                      />
                    </label>

                    <label
                      className="form-field"
                      htmlFor={`reservation_expires_at-${inventoryItemId}`}
                    >
                      <FieldLabel label="Vence" />
                      <DatePicker
                        id={`reservation_expires_at-${inventoryItemId}`}
                        name="reservation_expires_at"
                        placeholder="Sin vencimiento"
                      />
                    </label>

                    <label
                      className="form-field"
                      htmlFor={`reservation_channel_id-${inventoryItemId}`}
                    >
                      <FieldLabel label="Canal" />
                      <select
                        id={`reservation_channel_id-${inventoryItemId}`}
                        name="reservation_channel_id"
                      >
                        <option value="">Sin canal</option>
                        {salesChannels.map((channel) => (
                          <option key={channel.id} value={channel.id}>
                            {channel.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label
                      className="form-field"
                      htmlFor={`reservation_customer-${inventoryItemId}`}
                    >
                      <FieldLabel label="Contacto" />
                      <input
                        id={`reservation_customer-${inventoryItemId}`}
                        name="reservation_customer"
                        placeholder="Nombre o referencia"
                        type="text"
                      />
                    </label>
                  </div>
                </section>

                <section className="inventory-action-modal__section inventory-action-modal__section--secondary">
                  <label
                    className="form-field"
                    htmlFor={`reservation_notes-${inventoryItemId}`}
                  >
                    <FieldLabel label="Notas" />
                    <textarea
                      id={`reservation_notes-${inventoryItemId}`}
                      name="reservation_notes"
                      placeholder="Acuerdo, seña, condiciones o seguimiento pendiente."
                      rows={3}
                    />
                  </label>
                </section>
              </>
            ) : (
              <div className="inventory-action-modal__notice inventory-action-modal__notice--warning">
                <strong>Al confirmar</strong>
                <span>Se borran los datos de reserva y el producto vuelve a aparecer como disponible.</span>
              </div>
            )}

            <div className="confirm-dialog__actions">
              <button
                className="button button--secondary"
                disabled={isPending}
                onClick={closeReservationModal}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="button button--primary"
                disabled={isPending}
                type="submit"
              >
                {reservationConfirmValue ? "Reservar" : "Marcar disponible"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      <ConfirmDialog
        confirmLabel={
          pendingReservationMode ? "Confirmar reserva" : "Confirmar disponibilidad"
        }
        description={
          pendingReservationMode
            ? "Se marcará este producto como reservado con los datos cargados y dejará de figurar como disponible."
            : "Se eliminarán los datos de reserva y el producto volverá a estar disponible para la venta."
        }
        isOpen={pendingReservationFormData !== null}
        isPending={isPending}
        onCancel={() => {
          setPendingReservationFormData(null);
          setPendingReservationMode(null);
        }}
        onConfirm={handleConfirmReservation}
        title={pendingReservationMode ? "Confirmar reserva" : "Confirmar disponibilidad"}
      />
      <LoadingOverlay isVisible={isPending} message={pendingMessage} />
      <ResultModal
        autoCloseMs={7000}
        description={result?.description ?? ""}
        isOpen={result !== null}
        onClose={() => setResult(null)}
        title={result?.title ?? ""}
        variant={result?.variant ?? "success"}
      />
    </>
  );

  function clearFieldError(fieldName: string) {
    setMessage("");
    setFieldErrors((currentErrors) => {
      if (!Object.prototype.hasOwnProperty.call(currentErrors, fieldName)) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName as keyof InventorySaleFieldErrors];
      return nextErrors;
    });
  }
}

function FieldLabel({ error, label }: { error?: string; label: string }) {
  return (
    <span className="form-field__label-row">
      <span>{label}</span>
      {error ? (
        <small className="form-field__error" role="alert">
          {error}
        </small>
      ) : null}
    </span>
  );
}

function ModalHeader({
  description,
  eyebrow,
  title,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="inventory-action-modal__header">
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      <span>{description}</span>
    </div>
  );
}

function getSaleFieldClassName(error?: string) {
  return `form-field${error ? " form-field--error" : ""}`;
}

function getSalePriceInputDefaultValue(value: number | null | undefined) {
  return typeof value === "number"
    ? formatProductPriceInput(String(Math.round(value)))
    : "";
}

function focusSaleField(form: HTMLFormElement, fieldName: string) {
  const field = form.elements.namedItem(fieldName);

  if (field instanceof HTMLElement) {
    field.focus();
  }
}
