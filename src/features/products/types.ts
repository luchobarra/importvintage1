export type ProductImage = {
  id: string;
  image_url: string;
  image_path: string;
  position: number;
};

export type ProductCatalogCategory = {
  id: string;
  is_active: boolean;
  name: string;
  sizes_letter_enabled: boolean;
  sizes_numeric_enabled: boolean;
  slug: string;
};

export type ProductCatalogBrand = {
  id: string;
  is_active: boolean;
  name: string;
  slug: string;
};

export type ProductCatalogCondition = {
  id: string;
  is_active: boolean;
  name: string;
  slug: string;
};

export type ProductCatalogSize = {
  id: string;
  is_active: boolean;
  label: string;
  value: string;
};

export type Product = {
  id: string;
  title: string;
  brand_id: string | null;
  brand: string;
  category_id: string | null;
  category: string;
  condition_id: string;
  condition: string;
  size_id: string | null;
  size: string;
  price: number;
  description: string | null;
  status: "available";
  catalog_brands?: ProductCatalogBrand | null;
  catalog_categories?: ProductCatalogCategory | null;
  catalog_product_conditions?: ProductCatalogCondition | null;
  catalog_sizes?: ProductCatalogSize | null;
  product_images: ProductImage[];
};

export type ProductImageInput = {
  imageUrl: string;
  imagePath: string;
  position: number;
};
