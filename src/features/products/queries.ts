import { isAdminUser } from "@/features/auth/admin";
import { getPublicCatalogOptions } from "@/features/catalog-options/queries";
import {
  emptyPublicCatalogState,
  PUBLIC_RECENT_PRODUCTS_DAYS,
  PUBLIC_PRODUCTS_PAGE_SIZE,
  type PublicCatalogState,
} from "@/features/products/public-filters";
import { createSupabasePublicServerClient } from "@/lib/supabase/public-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/features/products/types";

const PRODUCT_SELECT = `
  id,
  title,
  brand_id,
  brand,
  category_id,
  category,
  condition_id,
  condition,
  size_id,
  size,
  price,
  description,
  is_exclusive,
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
  catalog_product_conditions (
    id,
    name,
    slug,
    is_active
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
  const supabase = createSupabasePublicServerClient();
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

  if (state.exclusive) {
    query = query.eq("is_exclusive", true);
  }

  if (state.recent) {
    query = query.gte("created_at", getRecentProductsStartDate());
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

export async function getSimilarAvailableProducts(
  product: Product,
  limit = 12,
) {
  const products: Product[] = [];
  const productIds = new Set([product.id]);

  function appendProducts(items: Product[]) {
    for (const item of items) {
      if (
        productIds.has(item.id) ||
        item.product_images.length === 0 ||
        products.length >= limit
      ) {
        continue;
      }

      productIds.add(item.id);
      products.push(item);
    }
  }

  if (product.category_id) {
    appendProducts(
      await getAvailableProductSubset({
        categoryId: product.category_id,
        excludeProductId: product.id,
        limit: limit * 2,
      }),
    );
  }

  if (products.length < limit && product.brand_id) {
    appendProducts(
      await getAvailableProductSubset({
        brandId: product.brand_id,
        excludeProductId: product.id,
        limit: limit * 2,
      }),
    );
  }

  if (products.length < limit) {
    appendProducts(
      await getAvailableProductSubset({
        excludeProductId: product.id,
        limit: limit * 2,
      }),
    );
  }

  return products.slice(0, limit);
}

export async function getAvailableProductById(productId: string) {
  const supabase = createSupabasePublicServerClient();

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

type AvailableProductSubsetOptions = {
  brandId?: string;
  categoryId?: string;
  excludeProductId?: string;
  limit: number;
};

async function getAvailableProductSubset({
  brandId,
  categoryId,
  excludeProductId,
  limit,
}: AvailableProductSubsetOptions) {
  const supabase = createSupabasePublicServerClient();

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "available");

  if (brandId) {
    query = query.eq("brand_id", brandId);
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (excludeProductId) {
    query = query.neq("id", excludeProductId);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("position", {
      ascending: true,
      referencedTable: "product_images",
    })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as Product[];
}

function getRecentProductsStartDate() {
  const startDate = new Date();

  startDate.setDate(startDate.getDate() - PUBLIC_RECENT_PRODUCTS_DAYS);

  return startDate.toISOString();
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
