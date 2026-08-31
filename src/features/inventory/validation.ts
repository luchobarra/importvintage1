import {
  INVENTORY_NOTES_MAX_LENGTH,
  INVENTORY_TEXT_MAX_LENGTH,
} from "@/features/inventory/constants";
import { isValidMeasurementInput } from "@/features/measurements/formatters";
import { getPriceDigits } from "@/features/products/form-validation";

export type InventoryFieldName =
  | "title"
  | "brand_id"
  | "category_id"
  | "size_id"
  | "condition_id"
  | "purchase_date"
  | "purchase_price"
  | "estimated_sale_price"
  | "height_cm"
  | "width_cm"
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
const INVENTORY_FIELD_LABELS: Record<InventoryFieldName, string> = {
  brand_id: "marca",
  category_id: "categoría",
  condition_id: "estado",
  estimated_sale_price: "precio estimado",
  height_cm: "alto",
  internal_description: "descripción",
  internal_notes: "notas",
  purchase_date: "fecha de compra",
  purchase_price: "precio de compra",
  size_id: "talle",
  title: "título",
  width_cm: "ancho",
};

const INVENTORY_FIELD_ORDER: InventoryFieldName[] = [
  "title",
  "category_id",
  "brand_id",
  "condition_id",
  "purchase_date",
  "purchase_price",
  "estimated_sale_price",
  "size_id",
  "height_cm",
  "width_cm",
  "internal_description",
  "internal_notes",
];

export function validateInventoryFormFields(formData: FormData) {
  const errors: InventoryFieldErrors = {};

  for (const fieldName of INVENTORY_FIELD_ORDER) {
    const fieldError = validateInventoryField(
      fieldName,
      String(formData.get(fieldName) ?? ""),
    );

    if (fieldError) {
      errors[fieldName] = fieldError;
    }
  }

  const invalidFields = INVENTORY_FIELD_ORDER.filter((fieldName) =>
    Boolean(errors[fieldName]),
  );

  return {
    errors,
    firstInvalidField: invalidFields[0] ?? null,
    message: getInventoryValidationMessage(invalidFields),
  };
}

export function validateInventoryField(
  fieldName: InventoryFieldName,
  value: string,
) {
  const normalizedValue = value.trim();

  if (
    [
      "title",
      "brand_id",
      "category_id",
      "condition_id",
      "purchase_date",
      "purchase_price",
      "internal_description",
    ].includes(fieldName) &&
    !normalizedValue
  ) {
    return `Falta completar el campo ${INVENTORY_FIELD_LABELS[fieldName]}.`;
  }

  if (fieldName === "purchase_date" && !DATE_PATTERN.test(normalizedValue)) {
    return "Selecciona una fecha válida.";
  }

  if (
    fieldName === "purchase_price" &&
    !isValidMoneyInput(normalizedValue, true)
  ) {
    return "Ingresa un precio de compra válido.";
  }

  if (
    fieldName === "estimated_sale_price" &&
    !isValidMoneyInput(normalizedValue, false)
  ) {
    return "Ingresa un precio estimado válido.";
  }

  if (
    (fieldName === "height_cm" || fieldName === "width_cm") &&
    !isValidMeasurementInput(normalizedValue, false)
  ) {
    return "Usa un número mayor a 0 con coma decimal.";
  }

  if (
    fieldName === "internal_description" &&
    normalizedValue.length > INVENTORY_TEXT_MAX_LENGTH
  ) {
    return `Máximo ${INVENTORY_TEXT_MAX_LENGTH} caracteres.`;
  }

  if (
    fieldName === "internal_notes" &&
    normalizedValue.length > INVENTORY_NOTES_MAX_LENGTH
  ) {
    return `Máximo ${INVENTORY_NOTES_MAX_LENGTH} caracteres.`;
  }

  return "";
}

export function validateInventorySaleFormFields(formData: FormData) {
  const errors: InventorySaleFieldErrors = {};
  const soldAt = getRequiredText(formData, "sold_at");
  const salePrice = getRequiredText(formData, "sale_price");
  const saleChannelId = getRequiredText(formData, "sale_channel_id");
  const saleNotes = String(formData.get("sale_notes") ?? "").trim();

  if (!soldAt || !DATE_PATTERN.test(soldAt)) {
    errors.sold_at = "Selecciona una fecha válida.";
  }

  if (!isValidMoneyInput(salePrice, true)) {
    errors.sale_price = "Ingresa el precio real de venta.";
  }

  if (!saleChannelId) {
    errors.sale_channel_id = "Selecciona el medio de venta.";
  }

  if (saleNotes.length > INVENTORY_NOTES_MAX_LENGTH) {
    errors.sale_notes = `Máximo ${INVENTORY_NOTES_MAX_LENGTH} caracteres.`;
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

function getInventoryValidationMessage(invalidFields: InventoryFieldName[]) {
  if (invalidFields.length === 0) {
    return "";
  }

  if (invalidFields.length === 1) {
    return `Falta completar el campo ${INVENTORY_FIELD_LABELS[invalidFields[0]]}.`;
  }

  const labels = invalidFields
    .map((fieldName) => INVENTORY_FIELD_LABELS[fieldName])
    .join(", ");

  return `Faltan completar estos campos: ${labels}.`;
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
