import {
  INVENTORY_NOTES_MAX_LENGTH,
  INVENTORY_TEXT_MAX_LENGTH,
} from "@/features/inventory/constants";
import { getPriceDigits } from "@/features/products/form-validation";

export type InventoryFieldName =
  | "title"
  | "category_id"
  | "condition_id"
  | "purchase_date"
  | "purchase_price"
  | "estimated_sale_price"
  | "internal_description"
  | "internal_notes";

export type InventoryFieldErrors = Partial<Record<InventoryFieldName, string>>;

export type InventorySaleFieldName =
  | "sold_at"
  | "sale_price"
  | "sale_channel_id"
  | "sale_notes";

export type InventorySaleFieldErrors = Partial<
  Record<InventorySaleFieldName, string>
>;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function validateInventoryFormFields(formData: FormData) {
  const errors: InventoryFieldErrors = {};
  const title = getRequiredText(formData, "title");
  const categoryId = getRequiredText(formData, "category_id");
  const conditionId = getRequiredText(formData, "condition_id");
  const purchaseDate = getRequiredText(formData, "purchase_date");
  const purchasePrice = getRequiredText(formData, "purchase_price");
  const estimatedSalePrice = getRequiredText(formData, "estimated_sale_price");
  const internalDescription = getRequiredText(formData, "internal_description");
  const internalNotes = String(formData.get("internal_notes") ?? "").trim();

  if (!title) {
    errors.title = "Ingresa un titulo.";
  }

  if (!categoryId) {
    errors.category_id = "Selecciona una categoria.";
  }

  if (!conditionId) {
    errors.condition_id = "Selecciona un estado.";
  }

  if (!purchaseDate || !DATE_PATTERN.test(purchaseDate)) {
    errors.purchase_date = "Selecciona una fecha valida.";
  }

  if (!isValidMoneyInput(purchasePrice, true)) {
    errors.purchase_price = "Ingresa un precio de compra valido.";
  }

  if (!isValidMoneyInput(estimatedSalePrice, false)) {
    errors.estimated_sale_price = "Ingresa un precio estimado valido.";
  }

  if (!internalDescription) {
    errors.internal_description = "Agrega una descripcion.";
  } else if (internalDescription.length > INVENTORY_TEXT_MAX_LENGTH) {
    errors.internal_description = `Maximo ${INVENTORY_TEXT_MAX_LENGTH} caracteres.`;
  }

  if (internalNotes.length > INVENTORY_NOTES_MAX_LENGTH) {
    errors.internal_notes = `Maximo ${INVENTORY_NOTES_MAX_LENGTH} caracteres.`;
  }

  const firstInvalidField = getFirstInventoryInvalidField(errors);

  return {
    errors,
    firstInvalidField,
    message: firstInvalidField
      ? "Revisa los campos marcados antes de guardar."
      : "",
  };
}

export function validateInventorySaleFormFields(formData: FormData) {
  const errors: InventorySaleFieldErrors = {};
  const soldAt = getRequiredText(formData, "sold_at");
  const salePrice = getRequiredText(formData, "sale_price");
  const saleChannelId = getRequiredText(formData, "sale_channel_id");
  const saleNotes = String(formData.get("sale_notes") ?? "").trim();

  if (!soldAt || !DATE_PATTERN.test(soldAt)) {
    errors.sold_at = "Selecciona una fecha valida.";
  }

  if (!isValidMoneyInput(salePrice, true)) {
    errors.sale_price = "Ingresa el precio real de venta.";
  }

  if (!saleChannelId) {
    errors.sale_channel_id = "Selecciona el medio de venta.";
  }

  if (saleNotes.length > INVENTORY_NOTES_MAX_LENGTH) {
    errors.sale_notes = `Maximo ${INVENTORY_NOTES_MAX_LENGTH} caracteres.`;
  }

  const firstInvalidField = getFirstSaleInvalidField(errors);

  return {
    errors,
    firstInvalidField,
    message: firstInvalidField
      ? "Completa los datos de venta para marcar el producto como vendido."
      : "",
  };
}

export function normalizeMoneyInput(value: FormDataEntryValue | null) {
  return getPriceDigits(String(value ?? "").trim());
}

function getRequiredText(formData: FormData, fieldName: string) {
  return String(formData.get(fieldName) ?? "").trim();
}

function isValidMoneyInput(value: string, required: boolean) {
  if (!value) {
    return !required;
  }

  const digits = getPriceDigits(value);
  const price = Number(digits);

  return Boolean(digits) && Number.isFinite(price) && price >= 0;
}

function getFirstInventoryInvalidField(errors: InventoryFieldErrors) {
  return (
    ([
      "title",
      "category_id",
      "condition_id",
      "purchase_date",
      "purchase_price",
      "estimated_sale_price",
      "internal_description",
      "internal_notes",
    ] as InventoryFieldName[]).find((fieldName) => errors[fieldName]) ?? null
  );
}

function getFirstSaleInvalidField(errors: InventorySaleFieldErrors) {
  return (
    ([
      "sold_at",
      "sale_price",
      "sale_channel_id",
      "sale_notes",
    ] as InventorySaleFieldName[]).find((fieldName) => errors[fieldName]) ??
    null
  );
}
