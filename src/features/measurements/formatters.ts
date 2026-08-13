const MEASUREMENT_INPUT_PATTERN = /^\d+(,\d{1,2})?$/;

export function normalizeMeasurementInput(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().replace(",", ".");
}

export function sanitizeMeasurementInput(value: string) {
  const normalizedValue = value.replaceAll(".", "").replace(/[^\d,]/g, "");
  const [integerPart = "", ...decimalParts] = normalizedValue.split(",");

  if (decimalParts.length === 0) {
    return integerPart;
  }

  return `${integerPart},${decimalParts.join("").slice(0, 2)}`;
}

export function isValidMeasurementInput(value: string, required: boolean) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return !required;
  }

  if (!MEASUREMENT_INPUT_PATTERN.test(normalizedValue)) {
    return false;
  }

  const measurement = Number(normalizeMeasurementInput(normalizedValue));

  return Number.isFinite(measurement) && measurement > 0;
}

export function formatMeasurementInput(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "";
  }

  return Number(value).toLocaleString("es-AR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    useGrouping: false,
  });
}

export function formatMeasurementValue(value: number) {
  return `${formatMeasurementInput(value)} cm`;
}

export function formatCompactMeasurementValue(value: number) {
  return `${formatMeasurementInput(value)}cm`;
}
