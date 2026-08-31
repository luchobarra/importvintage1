"use client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DatePicker } from "@/components/ui/DatePicker";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import {
  ResultModal,
  type ResultModalVariant,
} from "@/components/ui/ResultModal";
import { updateInventoryItemSale } from "@/features/inventory/actions";
import { formatInventoryCurrency } from "@/features/inventory/formatters";
import type { SalesChannel } from "@/features/inventory/types";
import {
  normalizeMoneyInput,
  validateInventorySaleFormFields,
  type InventorySaleFieldErrors,
} from "@/features/inventory/validation";
import { formatProductPriceInput } from "@/features/products/form-validation";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";
import { useRef, useState, useTransition } from "react";

type InventorySaleEditContainerProps = {
  inventoryItemId: string;
  saleAt: string | null;
  saleChannelId: string | null;
  saleNotes: string | null;
  salePrice: number | null;
  salesChannels: SalesChannel[];
};

type ResultState = {
  description: string;
  title: string;
  variant: ResultModalVariant;
};

export function InventorySaleEditContainer({
  inventoryItemId,
  saleAt,
  saleChannelId,
  saleNotes,
  salePrice,
  salesChannels,
}: InventorySaleEditContainerProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [pendingSaleFormData, setPendingSaleFormData] = useState<FormData | null>(
    null,
  );
  const [fieldErrors, setFieldErrors] = useState<InventorySaleFieldErrors>({});
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ResultState | null>(null);
  const [isPending, startTransition] = useTransition();

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

    startTransition(async () => {
      const actionResult = await updateInventoryItemSale(
        inventoryItemId,
        formData,
      );

      setResult({
        description: actionResult.message,
        title: actionResult.success
          ? "Venta actualizada"
          : "No se pudo actualizar",
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

  return (
    <>
      <button
        className="inventory-detail__event-action"
        disabled={isPending}
        onClick={() => setIsSaleModalOpen(true)}
        type="button"
      >
        <Pencil aria-hidden="true" size={14} />
        Editar
      </button>

      {isSaleModalOpen ? (
        <div className="confirm-dialog" role="presentation">
          <button
            aria-label="Cerrar edición de venta"
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
              title="Editar venta"
              description="Corregí los datos comerciales guardados para que las métricas reflejen la venta real."
            />

            <div className="inventory-action-modal__notice">
              <strong>Al confirmar</strong>
              <span>
                Se actualizan fecha, precio, canal y notas de la venta en stock
                y reportes.
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
                  htmlFor={`edit_sold_at-${inventoryItemId}`}
                >
                  <FieldLabel error={fieldErrors.sold_at} label="Fecha" />
                  <DatePicker
                    defaultValue={saleAt ?? ""}
                    id={`edit_sold_at-${inventoryItemId}`}
                    name="sold_at"
                    onChange={clearFieldError}
                    required
                  />
                </label>

                <label
                  className={getSaleFieldClassName(fieldErrors.sale_price)}
                  htmlFor={`edit_sale_price-${inventoryItemId}`}
                >
                  <FieldLabel
                    error={fieldErrors.sale_price}
                    label="Precio real"
                  />
                  <input
                    defaultValue={getSalePriceInputDefaultValue(salePrice)}
                    id={`edit_sale_price-${inventoryItemId}`}
                    inputMode="numeric"
                    name="sale_price"
                    onChange={handlePriceChange}
                    placeholder={formatInventoryCurrency(salePrice)}
                    required
                    type="text"
                  />
                </label>

                <label
                  className={getSaleFieldClassName(fieldErrors.sale_channel_id)}
                  htmlFor={`edit_sale_channel_id-${inventoryItemId}`}
                >
                  <FieldLabel
                    error={fieldErrors.sale_channel_id}
                    label="Canal"
                  />
                  <select
                    defaultValue={saleChannelId ?? ""}
                    id={`edit_sale_channel_id-${inventoryItemId}`}
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
                htmlFor={`edit_sale_notes-${inventoryItemId}`}
              >
                <FieldLabel error={fieldErrors.sale_notes} label="Notas" />
                <textarea
                  defaultValue={saleNotes ?? ""}
                  id={`edit_sale_notes-${inventoryItemId}`}
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
                Guardar venta
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel="Guardar venta"
        description="Se actualizarán los datos comerciales de la venta ya registrada."
        isOpen={pendingSaleFormData !== null}
        isPending={isPending}
        onCancel={() => setPendingSaleFormData(null)}
        onConfirm={handleConfirmSale}
        title="Confirmar edición de venta"
      />
      <LoadingOverlay isVisible={isPending} message="Actualizando venta..." />
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
