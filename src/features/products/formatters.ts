const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatProductPrice(price: number) {
  return currencyFormatter.format(price);
}

export function getProductBrandName(product: {
  brand: string;
  catalog_brands?: { name: string } | { name: string }[] | null;
}) {
  return getRelationValue(product.catalog_brands)?.name ?? product.brand;
}

export function getProductCategoryName(product: {
  category: string;
  catalog_categories?: { name: string } | { name: string }[] | null;
}) {
  return getRelationValue(product.catalog_categories)?.name ?? product.category;
}

export function getProductSizeLabel(product: {
  catalog_sizes?: { label: string } | { label: string }[] | null;
  size: string;
}) {
  return getRelationValue(product.catalog_sizes)?.label ?? product.size;
}

function getRelationValue<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
