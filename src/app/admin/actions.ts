"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminConfigured, isAdminUser } from "@/lib/auth/admin";
import { redirect } from "next/navigation";

const PRODUCT_CATEGORIES = ["pantalones", "buzos", "polar"] as const;

export type AuthFormState = {
  message: string;
};

export type ProductFormState = {
  message: string;
  success: boolean;
};

export type CreateProductDraftResult =
  | {
      success: true;
      productId: string;
    }
  | {
      success: false;
      message: string;
    };

export type ProductImageInput = {
  imageUrl: string;
  imagePath: string;
  position: number;
};

export async function login(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      message: "Completa email y contrasena.",
    };
  }

  if (!isAdminConfigured()) {
    return {
      message: "Falta configurar ADMIN_EMAIL en el entorno del proyecto.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      message: "Credenciales invalidas. Revisa los datos e intenta de nuevo.",
    };
  }

  if (!isAdminUser(data.user)) {
    await supabase.auth.signOut();

    return {
      message: "Este usuario no esta autorizado para acceder al panel.",
    };
  }

  redirect("/admin");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirect("/admin/login");
}

export async function createProductDraft(
  formData: FormData,
): Promise<CreateProductDraftResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    return {
      message: "No tenes permisos para cargar productos.",
      success: false,
    };
  }

  const title = String(formData.get("title") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const size = String(formData.get("size") ?? "").trim();
  const priceValue = String(formData.get("price") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(priceValue);

  if (!title || !brand || !category || !size || !priceValue) {
    return {
      message: "Completa todos los campos obligatorios.",
      success: false,
    };
  }

  if (!PRODUCT_CATEGORIES.includes(category as (typeof PRODUCT_CATEGORIES)[number])) {
    return {
      message: "Selecciona una categoria valida.",
      success: false,
    };
  }

  if (!Number.isFinite(price) || price <= 0) {
    return {
      message: "El precio debe ser un numero mayor a cero.",
      success: false,
    };
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      title,
      brand,
      category,
      size,
      price,
      description: description || null,
      status: "available",
    })
    .select("id")
    .single();

  if (error) {
    return {
      message: `No se pudo cargar el producto: ${error.message}`,
      success: false,
    };
  }

  return {
    success: true,
    productId: product.id,
  };
}

export async function saveProductImages(
  productId: string,
  images: ProductImageInput[],
): Promise<ProductFormState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    return {
      message: "No tenes permisos para guardar imagenes.",
      success: false,
    };
  }

  if (!productId || images.length < 1 || images.length > 5) {
    return {
      message: "La cantidad de imagenes debe ser entre 1 y 5.",
      success: false,
    };
  }

  const imageRows = images.map((image) => ({
    product_id: productId,
    image_url: image.imageUrl,
    image_path: image.imagePath,
    position: image.position,
  }));

  const { error: imagesError } = await supabase
    .from("product_images")
    .insert(imageRows);

  if (imagesError) {
    return {
      message: `No se pudieron guardar las imagenes: ${imagesError.message}`,
      success: false,
    };
  }

  return {
    message: "Producto cargado correctamente.",
    success: true,
  };
}

export async function deleteProductDraft(productId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    return;
  }

  await supabase.from("products").delete().eq("id", productId);
}
