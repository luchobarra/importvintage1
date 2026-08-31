import type {
  InventoryPublicationFilter,
  InventorySortOrder,
  InventoryStatus,
  InventoryStatusFilter,
  InventoryValueFilter,
} from "@/features/inventory/types";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatInventoryCurrency(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-";
  }

  return currencyFormatter.format(value);
}

export function formatInventoryDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateFormatter.format(date);
}

export function formatInventoryDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateTimeFormatter.format(date);
}

export function formatInventoryPercent(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return `${Math.round(value)}%`;
}

export function formatInventoryAgeDays(
  purchaseDate: string | null | undefined,
  endDate?: string | null,
) {
  if (!purchaseDate) {
    return "-";
  }

  const start = new Date(`${purchaseDate}T00:00:00`);
  const end = endDate ? new Date(`${endDate}T00:00:00`) : new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "-";
  }

  const days = Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / 86_400_000),
  );

  if (days === 0) {
    return "Hoy";
  }

  if (days === 1) {
    return "1 día";
  }

  return `${days} días`;
}

export function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function getInventoryStatusLabel(status: InventoryStatus) {
  if (status === "sold") {
    return "Vendido";
  }

  if (status === "reserved") {
    return "Reservada";
  }

  return "Disponible";
}

export function parseInventoryStatusFilter(
  value: string | undefined,
): InventoryStatusFilter {
  return value === "available" || value === "reserved" || value === "sold"
    ? value
    : value === "all"
      ? "all"
      : "available";
}

export function parseInventoryPublicationFilter(
  value: string | undefined,
): InventoryPublicationFilter {
  return value === "published" || value === "unpublished" ? value : "all";
}

export function parseInventoryValueFilter(
  value: string | undefined,
): InventoryValueFilter {
  return value === "estimated" || value === "sale" ? value : "purchase";
}

export function parseInventorySortOrder(
  value: string | undefined,
): InventorySortOrder {
  if (
    value === "oldest" ||
    value === "cost_desc" ||
    value === "cost_asc" ||
    value === "estimated_desc" ||
    value === "estimated_asc" ||
    value === "sale_desc" ||
    value === "sale_asc"
  ) {
    return value;
  }

  return "newest";
}
