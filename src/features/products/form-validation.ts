import { PRODUCT_DESCRIPTION_MAX_LENGTH } from "@/features/products/constants";

export type ProductFieldName =
  | "title"
  | "brand"
  | "category"
  | "size"
  | "price"
  | "description";

export type ProductFieldErrors = Partial<Record<ProductFieldName, string>>;

const PRODUCT_FIELD_LABELS: Record<ProductFieldName, string> = {
  title: "titulo",
  brand: "marca",
  category: "categoria",
  size: "talle",
  price: "precio",
  description: "descripcion",
};

const PRODUCT_FIELD_ORDER: ProductFieldName[] = [
  "title",
  "brand",
  "category",
  "size",
  "price",
  "description",
];

export function validateProductFormFields(formData: FormData) {
  const errors: ProductFieldErrors = {};

  for (const fieldName of PRODUCT_FIELD_ORDER) {
    const fieldError = validateProductField(
      fieldName,
      String(formData.get(fieldName) ?? ""),
    );

    if (fieldError) {
      errors[fieldName] = fieldError;
    }
  }

  const invalidFields = PRODUCT_FIELD_ORDER.filter((fieldName) =>
    Boolean(errors[fieldName]),
  );

  return {
    errors,
    firstInvalidField: invalidFields[0] ?? null,
    message: getProductValidationMessage(invalidFields),
  };
}

export function validateProductField(
  fieldName: ProductFieldName,
  value: string,
) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return `Falta completar el campo ${PRODUCT_FIELD_LABELS[fieldName]}.`;
  }

  if (fieldName === "price") {
    const priceDigits = getPriceDigits(normalizedValue);
    const numericValue = Number(priceDigits);

    if (!priceDigits) {
      return "El precio solo permite numeros.";
    }

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return "El precio debe ser un numero entero mayor a 0.";
    }
  }

  if (
    fieldName === "description" &&
    normalizedValue.length > PRODUCT_DESCRIPTION_MAX_LENGTH
  ) {
    return `La descripcion puede tener como maximo ${PRODUCT_DESCRIPTION_MAX_LENGTH} caracteres.`;
  }

  return "";
}

export function getPriceDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatProductPriceInput(value: string) {
  const priceDigits = getPriceDigits(value);

  if (!priceDigits) {
    return "";
  }

  return `$${Number(priceDigits).toLocaleString("es-AR")}`;
}

function getProductValidationMessage(invalidFields: ProductFieldName[]) {
  if (invalidFields.length === 0) {
    return "";
  }

  if (invalidFields.length === 1) {
    return `Falta completar el campo ${PRODUCT_FIELD_LABELS[invalidFields[0]]}.`;
  }

  const labels = invalidFields
    .map((fieldName) => PRODUCT_FIELD_LABELS[fieldName])
    .join(", ");

  return `Faltan completar estos campos: ${labels}.`;
}
