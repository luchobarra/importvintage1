export const PUBLIC_PRODUCTS_PAGE_SIZE = 12;
export const DEFAULT_PUBLIC_PRODUCT_SORT = "newest";

export type PublicProductSort = "newest" | "price_asc" | "price_desc";

export type PublicProductFilters = {
  brand: string;
  category: string;
  size: string;
};

export type PublicCatalogState = PublicProductFilters & {
  page: number;
  sort: PublicProductSort;
};

export type PublicProductSearchParams = {
  [key: string]: string | string[] | undefined;
};

export const emptyPublicProductFilters: PublicProductFilters = {
  brand: "",
  category: "",
  size: "",
};

export const emptyPublicCatalogState: PublicCatalogState = {
  ...emptyPublicProductFilters,
  page: 1,
  sort: DEFAULT_PUBLIC_PRODUCT_SORT,
};

export function parsePublicProductFilters(
  searchParams: PublicProductSearchParams,
): PublicProductFilters {
  return {
    brand: getSearchParamValue(searchParams.brand),
    category: getSearchParamValue(searchParams.category),
    size: getSearchParamValue(searchParams.size).toUpperCase(),
  };
}

export function parsePublicCatalogState(
  searchParams: PublicProductSearchParams,
): PublicCatalogState {
  return {
    ...parsePublicProductFilters(searchParams),
    page: getPublicPageValue(getSearchParamValue(searchParams.page)),
    sort: getPublicSortValue(getSearchParamValue(searchParams.sort)),
  };
}

export function hasPublicProductFilters(filters: PublicProductFilters) {
  return getPublicProductFilterValues(filters).some(
    (value) => value.trim() !== "",
  );
}

export function hasPublicCatalogControls(state: PublicCatalogState) {
  return (
    hasPublicProductFilters(state) || state.sort !== DEFAULT_PUBLIC_PRODUCT_SORT
  );
}

export function createPublicCatalogHref(
  state: PublicCatalogState,
  page = state.page,
) {
  const params = new URLSearchParams();

  appendCatalogParam(params, "brand", state.brand);
  appendCatalogParam(params, "category", state.category);
  appendCatalogParam(params, "size", state.size);

  if (state.sort !== DEFAULT_PUBLIC_PRODUCT_SORT) {
    params.set("sort", state.sort);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `/?${query}` : "/";
}

export function createPublicProductDetailHref(
  productId: string,
  catalogHref: string,
) {
  const params = new URLSearchParams({ from: catalogHref });

  return `/productos/${productId}?${params.toString()}`;
}

export function getCatalogReturnHref(searchParams: PublicProductSearchParams) {
  const from = getSearchParamValue(searchParams.from);

  if (!from.startsWith("/") || from.startsWith("//")) {
    return "/";
  }

  return from;
}

function getPublicPageValue(value: string) {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function getPublicSortValue(value: string): PublicProductSort {
  if (value === "price_asc" || value === "price_desc") {
    return value;
  }

  return DEFAULT_PUBLIC_PRODUCT_SORT;
}

function getPublicProductFilterValues(filters: PublicProductFilters) {
  return [filters.brand, filters.category, filters.size];
}

function appendCatalogParam(
  params: URLSearchParams,
  key: keyof PublicProductFilters,
  value: string,
) {
  const normalizedValue = value.trim();

  if (normalizedValue) {
    params.set(key, normalizedValue);
  }
}

function getSearchParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}
