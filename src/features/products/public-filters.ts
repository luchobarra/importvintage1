export const PUBLIC_PRODUCTS_PAGE_SIZE = 20;
export const PUBLIC_RECENT_PRODUCTS_DAYS = 30;

export type PublicProductSort = "" | "price_asc" | "price_desc";

export type PublicProductFilters = {
  brand: string;
  category: string;
  exclusive: boolean;
  size: string;
};

export type PublicCatalogState = PublicProductFilters & {
  recent: boolean;
  page: number;
  sort: PublicProductSort;
};

export type PublicProductSearchParams = {
  [key: string]: string | string[] | undefined;
};

export const emptyPublicProductFilters: PublicProductFilters = {
  brand: "",
  category: "",
  exclusive: false,
  size: "",
};

export const emptyPublicCatalogState: PublicCatalogState = {
  ...emptyPublicProductFilters,
  recent: false,
  page: 1,
  sort: "",
};

export function parsePublicProductFilters(
  searchParams: PublicProductSearchParams,
): PublicProductFilters {
  return {
    brand: getSearchParamValue(searchParams.brand),
    category: getSearchParamValue(searchParams.category),
    exclusive: getPublicBooleanValue(
      getSearchParamValue(searchParams.exclusivos),
    ),
    size: getSearchParamValue(searchParams.size).toUpperCase(),
  };
}

export function parsePublicCatalogState(
  searchParams: PublicProductSearchParams,
): PublicCatalogState {
  return {
    ...parsePublicProductFilters(searchParams),
    recent: getPublicBooleanValue(getSearchParamValue(searchParams.novedades)),
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
    hasPublicProductFilters(state) ||
    state.recent ||
    state.sort !== ""
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

  if (state.exclusive) {
    params.set("exclusivos", "1");
  }

  if (state.recent) {
    params.set("novedades", "1");
  }

  if (state.sort) {
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

function getPublicBooleanValue(value: string) {
  return value === "1" || value === "true";
}

function getPublicSortValue(value: string): PublicProductSort {
  if (value === "price_asc" || value === "price_desc") {
    return value;
  }

  return "";
}

function getPublicProductFilterValues(filters: PublicProductFilters) {
  return [
    filters.brand,
    filters.category,
    filters.size,
    filters.exclusive ? "exclusive" : "",
  ];
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
