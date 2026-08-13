import type {
  CatalogBrand,
  CatalogCategory,
  CatalogProductCondition,
} from "@/features/catalog-options/types";

export type InventoryStatus = "available" | "reserved" | "sold";

export type InventoryPublicationFilter = "all" | "published" | "unpublished";

export type InventoryValueFilter = "purchase" | "estimated" | "sale";

export type InventorySortOrder =
  | "newest"
  | "oldest"
  | "cost_desc"
  | "cost_asc"
  | "estimated_desc"
  | "estimated_asc"
  | "sale_desc"
  | "sale_asc";

export type InventoryStatusFilter = "all" | InventoryStatus;

export type InventorySearchParams = {
  brand?: string;
  category?: string;
  condition?: string;
  cost_max?: string;
  cost_min?: string;
  date?: string;
  published?: string;
  q?: string;
  sort?: string;
  status?: string;
  value_type?: string;
};

export type SalesChannel = {
  id: string;
  is_active: boolean;
  name: string;
  position: number;
  slug: string;
};

export type InventoryMovementType =
  | "created"
  | "updated"
  | "reserved"
  | "available"
  | "sold"
  | "deleted";

export type InventoryItemImage = {
  id: string;
  image_path: string;
  image_url: string;
  position: number;
};

export type InventoryCatalogProduct = {
  id: string;
  status: string;
  title: string;
};

export type InventoryItem = {
  id: string;
  visible_id: string;
  title: string;
  brand_id: string | null;
  category_id: string | null;
  condition_id: string | null;
  purchase_date: string;
  purchase_price: number;
  estimated_sale_price: number | null;
  height_cm: number | null;
  width_cm: number | null;
  internal_description: string | null;
  condition_notes: string | null;
  internal_notes: string | null;
  status: InventoryStatus;
  reserved_at: string | null;
  reservation_channel_id: string | null;
  reservation_customer: string | null;
  reservation_expires_at: string | null;
  reservation_notes: string | null;
  sold_at: string | null;
  sale_price: number | null;
  sale_channel_id: string | null;
  sale_notes: string | null;
  created_at: string;
  updated_at: string;
  catalog_brands?: CatalogBrand | null;
  catalog_categories?: CatalogCategory | null;
  catalog_product_conditions?: CatalogProductCondition | null;
  reservation_channels?: SalesChannel | null;
  sales_channels?: SalesChannel | null;
  inventory_item_images: InventoryItemImage[];
  inventory_item_movements?: InventoryMovement[];
  products?: InventoryCatalogProduct[];
};

export type InventoryMovement = {
  id: string;
  event_type: InventoryMovementType;
  title: string;
  notes: string | null;
  created_at: string;
};

export type InventoryImageInput = {
  imagePath: string;
  imageUrl: string;
  position: number;
};

export type InventoryListFilters = {
  brandId: string;
  categoryId: string;
  conditionId: string;
  costMax: string;
  costMin: string;
  published: InventoryPublicationFilter;
  purchaseDate: string;
  query: string;
  sort: InventorySortOrder;
  status: InventoryStatusFilter;
  valueType: InventoryValueFilter;
};
