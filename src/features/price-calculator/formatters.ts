export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function formatPercent(value: number | null) {
  if (value === null) {
    return "-";
  }

  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: "percent",
  }).format(value);
}

export function parseNumberInput(value: string) {
  const normalizedValue = value.trim().replace(/\./g, "").replace(",", ".");
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : Number.NaN;
}

export function toPercentInputValue(value: number) {
  return formatNumberInput(value * 100);
}

export function fromPercentInputValue(value: string) {
  return parseNumberInput(value) / 100;
}

export function formatNumberInput(value: number) {
  return Number.isInteger(value) ? String(value) : String(value).replace(".", ",");
}
