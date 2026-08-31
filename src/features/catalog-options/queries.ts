import { isAdminUser } from "@/features/auth/admin";
import type {
  CatalogBrand,
  CatalogCategory,
  CatalogOptions,
  CatalogOptionStatus,
  CatalogOptionUsage,
  CatalogProductCondition,
  CatalogSize,
} from "@/features/catalog-options/types";
import { createSupabasePublicServerClient } from "@/lib/supabase/public-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cache } from "react";

export const getPublicCatalogOptions = cache(async (): Promise<CatalogOptions> => {
  const supabase = createSupabasePublicServerClient();
  const [categoriesResult, brandsResult, sizesResult, conditionsResult] = await Promise.all([
    supabase
      .from("catalog_categories")
      .select(
        "id, name, slug, position, is_active, sizes_letter_enabled, sizes_numeric_enabled",
      )
      .eq("is_active", true)
      .order("position", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("catalog_brands")
      .select("id, name, slug, position, is_active")
      .eq("is_active", true)
      .order("position", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("catalog_sizes")
      .select("id, label, value, position, is_active, size_group")
      .eq("is_active", true)
      .order("size_group", { ascending: true })
      .order("position", { ascending: true })
      .order("label", { ascending: true }),
    supabase
      .from("catalog_product_conditions")
      .select("id, name, slug, position, is_active")
      .eq("is_active", true)
      .order("position", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  throwIfError(categoriesResult.error);
  throwIfError(brandsResult.error);
  throwIfError(sizesResult.error);
  throwIfError(conditionsResult.error);

  return {
    brands: (brandsResult.data ?? []) as CatalogBrand[],
    categories: (categoriesResult.data ?? []) as CatalogCategory[],
    conditions: (conditionsResult.data ?? []) as CatalogProductCondition[],
    sizes: (sizesResult.data ?? []) as CatalogSize[],
  };
});

export async function getAdminCatalogOptions(): Promise<CatalogOptions> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    throw new Error("No tenés permisos para administrar filtros.");
  }

  const [categoriesResult, brandsResult, sizesResult, conditionsResult] = await Promise.all([
    supabase
      .from("catalog_categories")
      .select(
        "id, name, slug, position, is_active, sizes_letter_enabled, sizes_numeric_enabled",
      )
      .order("position", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("catalog_brands")
      .select("id, name, slug, position, is_active")
      .order("position", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("catalog_sizes")
      .select("id, label, value, position, is_active, size_group")
      .order("size_group", { ascending: true })
      .order("position", { ascending: true })
      .order("label", { ascending: true }),
    supabase
      .from("catalog_product_conditions")
      .select("id, name, slug, position, is_active")
      .order("position", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  throwIfError(categoriesResult.error);
  throwIfError(brandsResult.error);
  throwIfError(sizesResult.error);
  throwIfError(conditionsResult.error);

  const usageMaps = await getAdminCatalogUsageMaps(supabase);

  return {
    brands: attachUsage(
      (brandsResult.data ?? []) as CatalogBrand[],
      usageMaps.brands,
    ),
    categories: attachUsage(
      (categoriesResult.data ?? []) as CatalogCategory[],
      usageMaps.categories,
    ),
    conditions: attachUsage(
      (conditionsResult.data ?? []) as CatalogProductCondition[],
      usageMaps.conditions,
    ),
    sizes: attachUsage(
      (sizesResult.data ?? []) as CatalogSize[],
      usageMaps.sizes,
    ),
  };
}

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

type CatalogUsageMaps = {
  brands: Map<string, CatalogOptionUsage>;
  categories: Map<string, CatalogOptionUsage>;
  conditions: Map<string, CatalogOptionUsage>;
  sizes: Map<string, CatalogOptionUsage>;
};

type CatalogUsageRow = {
  brand_id?: string | null;
  category_id?: string | null;
  condition_id?: string | null;
  size_id?: string | null;
};

async function getAdminCatalogUsageMaps(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const usageMaps: CatalogUsageMaps = {
    brands: new Map(),
    categories: new Map(),
    conditions: new Map(),
    sizes: new Map(),
  };

  const [productsResult, inventoryResult] = await Promise.all([
    supabase
      .from("products")
      .select("brand_id, category_id, condition_id, size_id"),
    supabase
      .from("inventory_items")
      .select("brand_id, category_id, condition_id, size_id"),
  ]);

  throwIfError(productsResult.error);
  throwIfError(inventoryResult.error);

  for (const row of (productsResult.data ?? []) as CatalogUsageRow[]) {
    incrementUsage(usageMaps.brands, row.brand_id, "products");
    incrementUsage(usageMaps.categories, row.category_id, "products");
    incrementUsage(usageMaps.conditions, row.condition_id, "products");
    incrementUsage(usageMaps.sizes, row.size_id, "products");
  }

  for (const row of (inventoryResult.data ?? []) as CatalogUsageRow[]) {
    incrementUsage(usageMaps.brands, row.brand_id, "inventoryItems");
    incrementUsage(usageMaps.categories, row.category_id, "inventoryItems");
    incrementUsage(usageMaps.conditions, row.condition_id, "inventoryItems");
    incrementUsage(usageMaps.sizes, row.size_id, "inventoryItems");
  }

  return usageMaps;
}

function attachUsage<T extends CatalogOptionStatus & { id: string }>(
  options: T[],
  usageMap: Map<string, CatalogOptionUsage>,
) {
  return options.map((option) => ({
    ...option,
    usage: usageMap.get(option.id) ?? getEmptyUsage(),
  }));
}

function incrementUsage(
  usageMap: Map<string, CatalogOptionUsage>,
  optionId: string | null | undefined,
  usageKey: keyof CatalogOptionUsage,
) {
  if (!optionId) {
    return;
  }

  const currentUsage = usageMap.get(optionId) ?? getEmptyUsage();

  usageMap.set(optionId, {
    ...currentUsage,
    [usageKey]: currentUsage[usageKey] + 1,
  });
}

function getEmptyUsage(): CatalogOptionUsage {
  return {
    inventoryItems: 0,
    products: 0,
  };
}
