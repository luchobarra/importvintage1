export type CatalogOptionStatus = {
  is_active: boolean;
};

export type CatalogCategory = CatalogOptionStatus & {
  id: string;
  name: string;
  position: number;
  slug: string;
  sizes_letter_enabled: boolean;
  sizes_numeric_enabled: boolean;
};

export type CatalogBrand = CatalogOptionStatus & {
  id: string;
  name: string;
  position: number;
  slug: string;
};

export type CatalogProductCondition = CatalogOptionStatus & {
  id: string;
  name: string;
  position: number;
  slug: string;
};

export type CatalogSize = CatalogOptionStatus & {
  id: string;
  label: string;
  position: number;
  value: string;
  size_group: CatalogSizeGroup;
};

export type CatalogSizeGroup = "letter" | "numeric";

export type CatalogOptions = {
  brands: CatalogBrand[];
  categories: CatalogCategory[];
  conditions: CatalogProductCondition[];
  sizes: CatalogSize[];
};

export type CatalogOptionActionState = {
  message: string;
  success: boolean;
};
