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
  const [fieldErrors, setFieldErrors] = useState<InventorySaleFieldErrors>({});
  const [message, setMessage] = useState("");
  const [pendingMessage, setPendingMessage] = useState("Procesando...");
  const [result, setResult] = useState<ResultState | null>(null);
  const [isPending, startTransition] = useTransition();
  const defaultSaleChannelId =
    catalogProductId && salesChannels.find((channel) => channel.slug === "catalogo")?.id;

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
            Ver catalogo
          </Link>
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
        <button
          className="button button--primary"
          disabled={isSold}
          onClick={() => setIsSaleModalOpen(true)}
          type="button"
        >
          <ReceiptText aria-hidden="true" size={15} />
          {isSold ? "Vendido" : "Marcar vendido"}
        </button>
        <button
          className="button button--secondary button--danger"
          disabled={isPending}
          onClick={() => setIsDeleteConfirmOpen(true)}
          type="button"
        >
          <Trash2 aria-hidden="true" size={15} />
          Eliminar
        </button>
      </div>

      {isSaleModalOpen ? (
        <div className="confirm-dialog" role="presentation">
          <form
            aria-modal="true"
            className="confirm-dialog__panel inventory-sale-modal"
            onSubmit={handleSaleSubmit}
            ref={formRef}
            role="dialog"
          >
            <div className="confirm-dialog__content">
              <h2 className="text-h2">Registrar venta</h2>
              <p className="text-body">
                Se guardan los datos comerciales para metricas futuras y se
                retira el producto del catalogo si estaba publicado.
              </p>
            </div>

            <div className="inventory-sale-modal__fields">
              <label
                className={getSaleFieldClassName(fieldErrors.sold_at)}
                htmlFor={`sold_at-${inventoryItemId}`}
              >
                <FieldLabel error={fieldErrors.sold_at} label="Fecha de venta" />
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
                  label="Precio real de venta"
                />
                <input
                  defaultValue={
                    estimatedSalePrice ? String(Math.round(estimatedSalePrice)) : ""
                  }
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
                  label="Medio de venta"
                />
                <select
                  defaultValue={defaultSaleChannelId || ""}
                  id={`sale_channel_id-${inventoryItemId}`}
                  name="sale_channel_id"
                  onChange={(event) => clearFieldError(event.currentTarget.name)}
                  required
                >
                  <option value="">Seleccionar</option>
                  {salesChannels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
              </label>

              <label
                className={getSaleFieldClassName(fieldErrors.sale_notes)}
                htmlFor={`sale_notes-${inventoryItemId}`}
              >
                <FieldLabel error={fieldErrors.sale_notes} label="Notas" />
                <textarea
                  id={`sale_notes-${inventoryItemId}`}
                  name="sale_notes"
                  onChange={(event) => clearFieldError(event.currentTarget.name)}
                  rows={3}
                />
              </label>
            </div>

            {message ? (
              <p aria-live="polite" className="auth-form__error">
                {message}
              </p>
            ) : null}

            <div className="confirm-dialog__actions">
              <button
                className="button button--secondary"
                disabled={isPending}
                onClick={() => setIsSaleModalOpen(false)}
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
        confirmLabel="Eliminar ingreso"
        description="Se eliminara este ingreso de stock y sus fotos. Si tenia una publicacion en catalogo, la publicacion no se elimina, pero queda desvinculada."
        isOpen={isDeleteConfirmOpen}
        isPending={isPending}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar ingreso"
        variant="danger"
      />
      {reservationConfirmValue !== null ? (
        <div className="confirm-dialog" role="presentation">
          <form
            aria-modal="true"
            className="confirm-dialog__panel inventory-sale-modal"
            onSubmit={handleReservationSubmit}
            ref={reservationFormRef}
            role="dialog"
          >
            <div className="confirm-dialog__content">
              <h2 className="text-h2">
                {reservationConfirmValue
                  ? "Reservar producto"
                  : "Marcar disponible"}
              </h2>
              <p className="text-body">
                {reservationConfirmValue
                  ? "Guarda los datos de reserva para mantener trazabilidad."
                  : "La reserva se eliminara y el producto volvera a estar disponible."}
              </p>
            </div>

            {reservationConfirmValue ? (
              <div className="inventory-sale-modal__fields">
                <label
                  className="form-field"
                  htmlFor={`reserved_at-${inventoryItemId}`}
                >
                  <FieldLabel label="Fecha de reserva" />
                  <DatePicker
                    defaultValue={getTodayDateInputValue()}
                    id={`reserved_at-${inventoryItemId}`}
                    name="reserved_at"
                    required
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
                  htmlFor={`reservation_notes-${inventoryItemId}`}
                >
                  <FieldLabel label="Notas" />
                  <textarea
                    id={`reservation_notes-${inventoryItemId}`}
                    name="reservation_notes"
                    rows={3}
                  />
                </label>
              </div>
            ) : null}

            <div className="confirm-dialog__actions">
              <button
                className="button button--secondary"
                disabled={isPending}
                onClick={() => setReservationConfirmValue(null)}
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

function getSaleFieldClassName(error?: string) {
  return `form-field${error ? " form-field--error" : ""}`;
}

function focusSaleField(form: HTMLFormElement, fieldName: string) {
  const field = form.elements.namedItem(fieldName);

  if (field instanceof HTMLElement) {
    field.focus();
  }
}
