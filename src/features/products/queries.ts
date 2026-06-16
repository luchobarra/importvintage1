import { isAdminUser } from "@/features/auth/admin";
import { getPublicCatalogOptions } from "@/features/catalog-options/queries";
import {
  emptyPublicCatalogState,
  PUBLIC_PRODUCTS_PAGE_SIZE,
  type PublicCatalogState,
} from "@/features/products/public-filters";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/features/products/types";

const PRODUCT_SELECT = `
  id,
  title,
  brand_id,
  brand,
  category_id,
  category,
  size_id,
  size,
  price,
  description,
  status,
  catalog_brands (
    id,
    name,
    slug,
    is_active
  ),
  catalog_categories (
    id,
    name,
    slug,
    is_active,
    sizes_letter_enabled,
    sizes_numeric_enabled
  ),
  catalog_sizes (
    id,
    label,
    value,
    is_active
  ),
  product_images (
    id,
    image_url,
    image_path,
    position
  )
`;

export async function getAvailableProductsPage(
  state: PublicCatalogState = emptyPublicCatalogState,
) {
  const supabase = await createSupabaseServerClient();
  const catalogOptions = await getPublicCatalogOptions();
  const selectedBrand = catalogOptions.brands.find(
    (brand) => brand.slug === state.brand,
  );
  const selectedCategory = catalogOptions.categories.find(
    (category) => category.slug === state.category,
  );
  const selectedSize = catalogOptions.sizes.find(
    (size) => size.value === state.size,
  );

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .eq("status", "available");

  if (selectedBrand) {
    query = query.eq("brand_id", selectedBrand.id);
  }

  if (selectedCategory) {
    query = query.eq("category_id", selectedCategory.id);
  }

  if (selectedSize) {
    query = query.eq("size_id", selectedSize.id);
  }

  if (state.sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (state.sort === "price_desc") {
    query = query.order("price", { ascending: false });
  }

  const startIndex = (state.page - 1) * PUBLIC_PRODUCTS_PAGE_SIZE;
  const endIndex = startIndex + PUBLIC_PRODUCTS_PAGE_SIZE - 1;

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .order("position", {
      ascending: true,
      referencedTable: "product_images",
    })
    .range(startIndex, endIndex);

  if (error) {
    throw new Error(error.message);
  }

  const products = (data ?? []) as unknown as Product[];

  return {
    products,
    totalCount: count ?? products.length,
  };
}

export async function getAvailableProducts() {
  const { products } = await getAvailableProductsPage();

  return products;
}

export async function getAvailableProductById(productId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", productId)
    .eq("status", "available")
    .order("position", {
      ascending: true,
      referencedTable: "product_images",
    })
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as Product;
}

export async function getAdminProducts() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    throw new Error("No tenes permisos para ver productos.");
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false })
    .order("position", {
      ascending: true,
      referencedTable: "product_images",
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as Product[];
}

export async function getAdminProductById(productId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    throw new Error("No tenes permisos para ver este producto.");
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", productId)
    .order("position", {
      ascending: true,
      referencedTable: "product_images",
    })
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as Product;
}
