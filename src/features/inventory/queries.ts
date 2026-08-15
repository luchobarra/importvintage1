import { isAdminUser } from "@/features/auth/admin";
import {
  parseInventoryPublicationFilter,
  parseInventorySortOrder,
  parseInventoryStatusFilter,
  parseInventoryValueFilter,
} from "@/features/inventory/formatters";
import type {
  InventoryItem,
  InventoryListFilters,
  InventorySearchParams,
  SalesChannel,
} from "@/features/inventory/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const INVENTORY_SELECT = `
  id,
  visible_id,
  title,
  brand_id,
  category_id,
  condition_id,
  purchase_date,
  purchase_price,
  estimated_sale_price,
  height_cm,
  width_cm,
  internal_description,
  condition_notes,
  internal_notes,
  status,
  reserved_at,
  reservation_channel_id,
  reservation_customer,
  reservation_expires_at,
  reservation_notes,
  sold_at,
  sale_price,
  sale_channel_id,
  sale_notes,
  created_at,
  updated_at,
  catalog_brands (
    id,
    name,
    slug,
    position,
    is_active
  ),
  catalog_categories (
    id,
    name,
    slug,
    position,
    is_active,
    sizes_letter_enabled,
    sizes_numeric_enabled
  ),
  catalog_product_conditions (
    id,
    name,
    slug,
    position,
    is_active
  ),
  inventory_item_images (
    id,
    image_url,
    image_path,
    position
  ),
  products (
    id,
    title,
    status
  )
`;

export function parseInventoryListFilters(
  searchParams?: InventorySearchParams,
): InventoryListFilters {
  return {
    brandId: parseUuidFilter(searchParams?.brand),
    categoryId: parseUuidFilter(searchParams?.category),
    conditionId: parseUuidFilter(searchParams?.condition),
    costMax: parseCostFilter(searchParams?.cost_max),
    costMin: parseCostFilter(searchParams?.cost_min),
    published: parseInventoryPublicationFilter(searchParams?.published),
    purchaseDate: parseDateFilter(searchParams?.date),
    query: String(searchParams?.q ?? "").trim(),
    sort: parseInventorySortOrder(searchParams?.sort),
    status: parseInventoryStatusFilter(searchParams?.status),
    valueType: parseInventoryValueFilter(searchParams?.value_type),
  };
}

export async function getInventoryItems(filters: InventoryListFilters) {
  const supabase = await createAdminSupabaseClient();
  let query = supabase
    .from("inventory_items")
    .select(INVENTORY_SELECT);

  if (filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.brandId) {
    query = query.eq("brand_id", filters.brandId);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.conditionId) {
    query = query.eq("condition_id", filters.conditionId);
  }

  if (filters.purchaseDate) {
    query = query.eq("purchase_date", filters.purchaseDate);
  }

  if (filters.costMin) {
    query = query.gte(
      getInventoryValueColumn(filters.valueType),
      Number(normalizeCostFilter(filters.costMin)),
    );
  }

  if (filters.costMax) {
    query = query.lte(
      getInventoryValueColumn(filters.valueType),
      Number(normalizeCostFilter(filters.costMax)),
    );
  }

  if (filters.query) {
    const normalizedQuery = filters.query.replaceAll("%", "").trim();

    if (isUuid(normalizedQuery)) {
      query = query.eq("id", normalizedQuery);
    } else {
      query = query.or(
        `visible_id.ilike.%${normalizedQuery}%,title.ilike.%${normalizedQuery}%,internal_description.ilike.%${normalizedQuery}%`,
      );
    }
  }

  if (filters.sort === "cost_desc") {
    query = query.order("purchase_price", { ascending: false });
  } else if (filters.sort === "cost_asc") {
    query = query.order("purchase_price", { ascending: true });
  } else if (filters.sort === "estimated_desc") {
    query = query.order("estimated_sale_price", {
      ascending: false,
      nullsFirst: false,
    });
  } else if (filters.sort === "estimated_asc") {
    query = query.order("estimated_sale_price", {
      ascending: true,
      nullsFirst: false,
    });
  } else if (filters.sort === "sale_desc") {
    query = query.order("sale_price", {
      ascending: false,
      nullsFirst: false,
    });
  } else if (filters.sort === "sale_asc") {
    query = query.order("sale_price", {
      ascending: true,
      nullsFirst: false,
    });
  } else {
    query = query.order("purchase_date", {
      ascending: filters.sort === "oldest",
    });
  }

  const { data, error } = await query
    .order("created_at", { ascending: filters.sort === "oldest" })
    .order("position", {
      ascending: true,
      referencedTable: "inventory_item_images",
    })
    .limit(500);

  if (error) {
    throw new Error(error.message);
  }

  const items = (data ?? []) as unknown as InventoryItem[];

  if (filters.published === "published") {
    return items.filter((item) => (item.products ?? []).length > 0);
  }

  if (filters.published === "unpublished") {
    return items.filter((item) => (item.products ?? []).length === 0);
  }

  return items;
}

function parseDateFilter(value: string | undefined) {
  const normalizedValue = String(value ?? "").trim();

  return /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue) ? normalizedValue : "";
}

function parseCostFilter(value: string | undefined) {
  const digits = normalizeCostFilter(value ?? "");

  if (!digits) {
    return "";
  }

  return `$${Number(digits).toLocaleString("es-AR")}`;
}

function normalizeCostFilter(value: string) {
  return value.replace(/\D/g, "");
}

function getInventoryValueColumn(valueType: InventoryListFilters["valueType"]) {
  if (valueType === "estimated") {
    return "estimated_sale_price";
  }

  if (valueType === "sale") {
    return "sale_price";
  }

  return "purchase_price";
}

function parseUuidFilter(value: string | undefined) {
  const normalizedValue = String(value ?? "").trim();

  return isUuid(normalizedValue) ? normalizedValue : "";
}

export async function getInventoryItemById(inventoryItemId: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select(INVENTORY_SELECT)
    .eq("id", inventoryItemId)
    .order("position", {
      ascending: true,
      referencedTable: "inventory_item_images",
    })
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const item = data as unknown as InventoryItem;
  const [movements, saleChannel, reservationChannel] = await Promise.all([
    getInventoryMovements(supabase, inventoryItemId),
    getSalesChannelById(supabase, item.sale_channel_id),
    getSalesChannelById(supabase, item.reservation_channel_id),
  ]);

  return {
    ...item,
    inventory_item_movements: movements,
    reservation_channels: reservationChannel,
    sales_channels: saleChannel,
  } as InventoryItem;
}

export async function getActiveSalesChannels() {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("sales_channels")
    .select("id, name, slug, position, is_active")
    .eq("is_active", true)
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SalesChannel[];
}

export async function getSalesChannels() {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("sales_channels")
    .select("id, name, slug, position, is_active")
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SalesChannel[];
}

async function createAdminSupabaseClient() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    throw new Error("No tenés permisos para administrar stock.");
  }

  return supabase;
}

async function getInventoryMovements(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  inventoryItemId: string,
) {
  const { data } = await supabase
    .from("inventory_item_movements")
    .select("id, event_type, title, notes, created_at")
    .eq("inventory_item_id", inventoryItemId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

async function getSalesChannelById(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  channelId: string | null,
) {
  if (!channelId) {
    return null;
  }

  const { data } = await supabase
    .from("sales_channels")
    .select("id, name, slug, position, is_active")
    .eq("id", channelId)
    .maybeSingle();

  return data as SalesChannel | null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
