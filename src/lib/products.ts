import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProductImage = {
  id: string;
  image_url: string;
  image_path: string;
  position: number;
};

export type Product = {
  id: string;
  title: string;
  brand: string;
  category: string;
  size: string;
  price: number;
  description: string | null;
  status: "available";
  product_images: ProductImage[];
};

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
