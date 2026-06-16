import type { CatalogSizeGroup } from "@/features/catalog-options/types";

export type CatalogOptionKind = "brand" | "category" | "size";

export const CATALOG_OPTION_LABELS: Record<CatalogOptionKind, string> = {
  brand: "marca",
  category: "categoria",
  size: "talle",
};

export function createSlug(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createSizeValue(value: string) {
  return value.trim().toUpperCase();
}

export function normalizeCatalogSizeGroup(
  value: string,
): CatalogSizeGroup | null {
  if (value === "letter" || value === "numeric") {
    return value;
  }

  return null;
}

export function normalizeCatalogOptionName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function validateCatalogOptionName(kind: CatalogOptionKind, value: string) {
  const normalizedValue = normalizeCatalogOptionName(value);

  if (!normalizedValue) {
    return `Falta completar ${CATALOG_OPTION_LABELS[kind]}.`;
  }

  if (kind !== "size" && !createSlug(normalizedValue)) {
    return `La ${CATALOG_OPTION_LABELS[kind]} necesita letras o numeros.`;
  }

  if (kind === "size" && !createSizeValue(normalizedValue)) {
    return "El talle necesita letras o numeros.";
  }

  return "";
}

export function validateCatalogSizeValue(
  value: string,
  group: CatalogSizeGroup,
) {
  const normalizedValue = createSizeValue(value);

  if (group === "numeric" && !/^\d+$/.test(normalizedValue)) {
    return "El talle numerico debe tener solo numeros.";
  }

  if (group === "letter" && !/[A-Z]/.test(normalizedValue)) {
    return "El talle de letras debe incluir letras.";
  }

  return "";
}
