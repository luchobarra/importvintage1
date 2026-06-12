"use server";

import { isAdminUser } from "@/features/auth/admin";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_DESCRIPTION_MAX_LENGTH,
} from "@/features/products/constants";
import { getPriceDigits } from "@/features/products/form-validation";
import type { ProductImageInput } from "@/features/products/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const size = String(formData.get("size") ?? "").trim().toUpperCase();
  const rawPriceValue = String(formData.get("price") ?? "").trim();
  const priceValue = getPriceDigits(rawPriceValue);
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(priceValue);

  if (!title || !brand || !category || !size || !priceValue || !description) {
    return {
      message: "Completa todos los campos obligatorios.",
      success: false,
    };
  }

  if (rawPriceValue !== priceValue) {
    return {
      message: "El precio solo permite numeros.",
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

  if (description.length > PRODUCT_DESCRIPTION_MAX_LENGTH) {
    return {
      message: `La descripcion puede tener como maximo ${PRODUCT_DESCRIPTION_MAX_LENGTH} caracteres.`,
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
      description,
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

export async function updateProduct(
  productId: string,
  formData: FormData,
): Promise<ProductFormState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    return {
      message: "No tenes permisos para editar productos.",
      success: false,
    };
  }

  const title = String(formData.get("title") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const size = String(formData.get("size") ?? "").trim().toUpperCase();
  const rawPriceValue = String(formData.get("price") ?? "").trim();
  const priceValue = getPriceDigits(rawPriceValue);
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(priceValue);

  if (
    !productId ||
    !title ||
    !brand ||
    !category ||
    !size ||
    !priceValue ||
    !description
  ) {
    return {
      message: "Completa todos los campos obligatorios.",
      success: false,
    };
  }

  if (rawPriceValue !== priceValue) {
    return {
      message: "El precio solo permite numeros.",
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

  if (description.length > PRODUCT_DESCRIPTION_MAX_LENGTH) {
    return {
      message: `La descripcion puede tener como maximo ${PRODUCT_DESCRIPTION_MAX_LENGTH} caracteres.`,
      success: false,
    };
  }

  const { error } = await supabase
    .from("products")
    .update({
      title,
      brand,
      category,
      size,
      price,
      description,
    })
    .eq("id", productId);

  if (error) {
    return {
      message: `No se pudo guardar el producto: ${error.message}`,
      success: false,
    };
  }

  return {
    message: "Producto actualizado correctamente.",
    success: true,
  };
}

export async function deleteProduct(
  productId: string,
): Promise<ProductFormState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    return {
      message: "No tenes permisos para eliminar productos.",
      success: false,
    };
  }

  if (!productId) {
    return {
      message: "Falta el ID del producto a eliminar.",
      success: false,
    };
  }

  const { data: images, error: imagesQueryError } = await supabase
    .from("product_images")
    .select("image_path")
    .eq("product_id", productId);

  if (imagesQueryError) {
    return {
      message: `No se pudieron buscar las imagenes: ${imagesQueryError.message}`,
      success: false,
    };
  }

  const imagePaths = (images ?? [])
    .map((image) => image.image_path)
    .filter((imagePath): imagePath is string => Boolean(imagePath));

  if (imagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("product-images")
      .remove(imagePaths);

    if (storageError) {
      return {
        message: `No se pudieron eliminar las imagenes: ${storageError.message}`,
        success: false,
      };
    }
  }

  const { error: imageRowsError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);

  if (imageRowsError) {
    return {
      message: `No se pudieron eliminar los registros de imagenes: ${imageRowsError.message}`,
      success: false,
    };
  }

  const { error: productError } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (productError) {
    return {
      message: `No se pudo eliminar el producto: ${productError.message}`,
      success: false,
    };
  }

  return {
    message: "Producto eliminado correctamente.",
    success: true,
  };
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
): Promise<ProductFormState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    return {
      message: "No tenes permisos para eliminar imagenes.",
      success: false,
    };
  }

  if (!productId || !imageId) {
    return {
      message: "Faltan datos para eliminar la imagen.",
      success: false,
    };
  }

  const { data: images, error: imagesError } = await supabase
    .from("product_images")
    .select("id, image_path, position")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (imagesError) {
    return {
      message: `No se pudieron buscar las imagenes: ${imagesError.message}`,
      success: false,
    };
  }

  if (!images || images.length <= 1) {
    return {
      message: "El producto debe tener al menos 1 imagen.",
      success: false,
    };
  }

  const imageToDelete = images.find((image) => image.id === imageId);

  if (!imageToDelete) {
    return {
      message: "La imagen no existe o no pertenece a este producto.",
      success: false,
    };
  }

  const { error: storageError } = await supabase.storage
    .from("product-images")
    .remove([imageToDelete.image_path]);

  if (storageError) {
    return {
      message: `No se pudo eliminar la imagen del storage: ${storageError.message}`,
      success: false,
    };
  }

  const { error: deleteRowError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("product_id", productId);

  if (deleteRowError) {
    return {
      message: `No se pudo eliminar el registro de la imagen: ${deleteRowError.message}`,
      success: false,
    };
  }

  const remainingImages = images.filter((image) => image.id !== imageId);

  for (const [index, image] of remainingImages.entries()) {
    const { error } = await supabase
      .from("product_images")
      .update({ position: index + 1 })
      .eq("id", image.id)
      .eq("product_id", productId);

    if (error) {
      return {
        message: `La imagen se elimino, pero no se pudieron reordenar las posiciones: ${error.message}`,
        success: false,
      };
    }
  }

  return {
    message: "Imagen eliminada correctamente.",
    success: true,
  };
}

export async function appendProductImages(
  productId: string,
  images: ProductImageInput[],
): Promise<ProductFormState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    return {
      message: "No tenes permisos para agregar imagenes.",
      success: false,
    };
  }

  if (!productId || images.length < 1) {
    return {
      message: "Selecciona al menos 1 imagen para subir.",
      success: false,
    };
  }

  const { data: currentImages, error: currentImagesError } = await supabase
    .from("product_images")
    .select("id, image_url, image_path, position")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (currentImagesError) {
    return {
      message: `No se pudieron validar las imagenes actuales: ${currentImagesError.message}`,
      success: false,
    };
  }

  const currentImageCount = currentImages?.length ?? 0;

  if (currentImageCount + images.length > 5) {
    return {
      message: "El producto puede tener como maximo 5 imagenes.",
      success: false,
    };
  }

  const imageRows = images.map((image) => ({
    product_id: productId,
    image_url: image.imageUrl,
    image_path: image.imagePath,
    position: image.position,
  }));

  const { error } = await supabase.from("product_images").insert(imageRows);

  if (error) {
    return {
      message: `No se pudieron guardar las nuevas imagenes: ${error.message}`,
      success: false,
    };
  }

  return {
    message: "Imagenes agregadas correctamente.",
    success: true,
  };
}

export async function updateProductImagePositions(
  productId: string,
  imagePositions: { id: string; position: number }[],
): Promise<ProductFormState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    return {
      message: "No tenes permisos para reordenar imagenes.",
      success: false,
    };
  }

  if (!productId || imagePositions.length < 1) {
    return {
      message: "Faltan datos para guardar el orden.",
      success: false,
    };
  }

  const { data: currentImages, error: currentImagesError } = await supabase
    .from("product_images")
    .select("id, image_url, image_path, position")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (currentImagesError) {
    return {
      message: `No se pudieron validar las imagenes: ${currentImagesError.message}`,
      success: false,
    };
  }

  const currentImageIds = new Set((currentImages ?? []).map((image) => image.id));
  const hasInvalidImage = imagePositions.some(
    (image) => !currentImageIds.has(image.id),
  );

  if (hasInvalidImage || currentImageIds.size !== imagePositions.length) {
    return {
      message: "El orden enviado no coincide con las imagenes del producto.",
      success: false,
    };
  }

  const sortedPositions = imagePositions
    .map((image) => image.position)
    .sort((first, second) => first - second);
  const hasInvalidPositions = sortedPositions.some(
    (position, index) => position !== index + 1,
  );

  if (hasInvalidPositions) {
    return {
      message: "Las posiciones deben ser consecutivas desde 1.",
      success: false,
    };
  }

  const currentImagesById = new Map(
    (currentImages ?? []).map((image) => [image.id, image]),
  );
  const reorderedRows = imagePositions
    .sort((first, second) => first.position - second.position)
    .map((image) => {
      const currentImage = currentImagesById.get(image.id);

      return {
        id: image.id,
        product_id: productId,
        image_url: currentImage?.image_url,
        image_path: currentImage?.image_path,
        position: image.position,
      };
    });
  const originalRows = (currentImages ?? []).map((image) => ({
    id: image.id,
    product_id: productId,
    image_url: image.image_url,
    image_path: image.image_path,
    position: image.position,
  }));

  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    return {
      message: `No se pudo preparar el nuevo orden: ${deleteError.message}`,
      success: false,
    };
  }

  const { error: insertError } = await supabase
    .from("product_images")
    .insert(reorderedRows);

  if (insertError) {
    await supabase.from("product_images").insert(originalRows);

    return {
      message: `No se pudo guardar el orden: ${insertError.message}`,
      success: false,
    };
  }

  return {
    message: "Orden de imagenes guardado correctamente.",
    success: true,
  };
}
