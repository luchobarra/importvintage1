import { isAdminUser } from "@/features/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/features/products/types";

export async function getAvailableProducts() {
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
    .eq("status", "available")
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
