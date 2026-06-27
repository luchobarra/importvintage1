import { isAdminUser } from "@/features/auth/admin";
import type {
  CatalogBrand,
  CatalogCategory,
  CatalogOptions,
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
    throw new Error("No tenes permisos para administrar filtros.");
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

  return {
    brands: (brandsResult.data ?? []) as CatalogBrand[],
    categories: (categoriesResult.data ?? []) as CatalogCategory[],
    conditions: (conditionsResult.data ?? []) as CatalogProductCondition[],
    sizes: (sizesResult.data ?? []) as CatalogSize[],
  };
}

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}
