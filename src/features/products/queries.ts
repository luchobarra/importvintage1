import { isAdminUser } from "@/features/auth/admin";
import {
  emptyPublicCatalogState,
  PUBLIC_PRODUCTS_PAGE_SIZE,
  type PublicCatalogState,
} from "@/features/products/public-filters";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/features/products/types";

export async function getAvailableProductsPage(
  state: PublicCatalogState = emptyPublicCatalogState,
) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("products")
    .select(
      `
        id,
        title,
        brand,
        category,
        size,
        price,
        description,
        status,
        product_images (
          id,
          image_url,
          image_path,
          position
        )
      `,
      { count: "exact" },
    )
    .eq("status", "available");

  if (state.brand) {
    query = query.ilike("brand", `%${state.brand}%`);
  }

  if (state.category) {
    query = query.eq("category", state.category);
  }

  if (state.size) {
    query = query.eq("size", state.size);
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

  const products = (data ?? []) as Product[];

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
    .select(
      `
        id,
        title,
        brand,
        category,
        size,
        price,
        description,
        status,
        product_images (
          id,
          image_url,
          image_path,
          position
        )
      `,
    )
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

  return data as Product;
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
    .select(
      `
        id,
        title,
        brand,
        category,
        size,
        price,
        description,
        status,
        product_images (
          id,
          image_url,
          image_path,
          position
        )
      `,
    )
    .order("created_at", { ascending: false })
    .order("position", {
      ascending: true,
      referencedTable: "product_images",
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Product[];
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
    .select(
      `
        id,
        title,
        brand,
        category,
        size,
        price,
        description,
        status,
        product_images (
          id,
          image_url,
          image_path,
          position
        )
      `,
    )
    .eq("id", productId)
    .order("position", {
      ascending: true,
      referencedTable: "product_images",
    })
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Product;
}
