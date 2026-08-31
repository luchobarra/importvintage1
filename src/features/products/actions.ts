"use server";

import { isAdminUser } from "@/features/auth/admin";
import {
  isValidMeasurementInput,
  normalizeMeasurementInput,
} from "@/features/measurements/formatters";
import { PRODUCT_DESCRIPTION_MAX_LENGTH } from "@/features/products/constants";
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
      message: "No tenés permisos para cargar productos.",
      success: false,
    };
  }

  const title = String(formData.get("title") ?? "").trim();
  const brandId = String(formData.get("brand") ?? "").trim();
  const categoryId = String(formData.get("category") ?? "").trim();
  const conditionId = String(formData.get("condition") ?? "").trim();
  const sizeId = String(formData.get("size") ?? "").trim();
  const heightValue = String(formData.get("height_cm") ?? "").trim();
  const widthValue = String(formData.get("width_cm") ?? "").trim();
  const rawPriceValue = String(formData.get("price") ?? "").trim();
  const priceValue = getPriceDigits(rawPriceValue);
  const description = String(formData.get("description") ?? "").trim();
  const isExclusive = formData.get("is_exclusive") === "on";
  const inventoryItemId = String(formData.get("inventory_item_id") ?? "").trim();
  const heightCm = Number(normalizeMeasurementInput(heightValue));
  const widthCm = Number(normalizeMeasurementInput(widthValue));
  const price = Number(priceValue);

  if (
    !title ||
    !brandId ||
    !categoryId ||
    !conditionId ||
    !sizeId ||
    !heightValue ||
    !widthValue ||
    !priceValue ||
    !description
  ) {
    return {
      message: "Completa todos los campos obligatorios.",
      success: false,
    };
  }

  if (
    !isValidMeasurementInput(heightValue, true) ||
    !isValidMeasurementInput(widthValue, true)
  ) {
    return {
      message: "Las medidas deben ser números mayores a cero y usar coma para decimales.",
      success: false,
    };
  }

  if (rawPriceValue !== priceValue) {
    return {
      message: "El precio solo permite números.",
      success: false,
    };
  }

  if (!Number.isFinite(price) || price <= 0) {
    return {
      message: "El precio debe ser un número mayor a cero.",
      success: false,
    };
  }

  if (description.length > PRODUCT_DESCRIPTION_MAX_LENGTH) {
    return {
      message: `La descripción puede tener como máximo ${PRODUCT_DESCRIPTION_MAX_LENGTH} caracteres.`,
      success: false,
    };
  }

  if (inventoryItemId) {
    const inventoryValidation = await validatePublishableInventoryItem(
      supabase,
      inventoryItemId,
    );

    if (!inventoryValidation.success) {
      return inventoryValidation;
    }
  }

  const catalogSelection = await getCatalogSelection({
    brandId,
    categoryId,
    conditionId,
    sizeId,
  });

  if (!catalogSelection.success) {
    return catalogSelection;
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      title,
      brand_id: brandId,
      brand: catalogSelection.brand.name,
      category_id: categoryId,
      category: catalogSelection.category.slug,
      condition_id: conditionId,
      condition: catalogSelection.condition.name,
      size_id: sizeId,
      size: catalogSelection.size.value,
      height_cm: heightCm,
      width_cm: widthCm,
      price,
      description,
      inventory_item_id: inventoryItemId || null,
      is_exclusive: isExclusive,
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
      message: "No tenés permisos para guardar imágenes.",
      success: false,
    };
  }

  if (!productId || images.length < 1 || images.length > 5) {
    return {
      message: "La cantidad de imágenes debe ser entre 1 y 5.",
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
      message: `No se pudieron guardar las imágenes: ${imagesError.message}`,
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
      message: "No tenés permisos para editar productos.",
      success: false,
    };
  }

  const title = String(formData.get("title") ?? "").trim();
  const brandId = String(formData.get("brand") ?? "").trim();
  const categoryId = String(formData.get("category") ?? "").trim();
  const conditionId = String(formData.get("condition") ?? "").trim();
  const sizeId = String(formData.get("size") ?? "").trim();
  const heightValue = String(formData.get("height_cm") ?? "").trim();
  const widthValue = String(formData.get("width_cm") ?? "").trim();
  const rawPriceValue = String(formData.get("price") ?? "").trim();
  const priceValue = getPriceDigits(rawPriceValue);
  const description = String(formData.get("description") ?? "").trim();
  const isExclusive = formData.get("is_exclusive") === "on";
  const heightCm = Number(normalizeMeasurementInput(heightValue));
  const widthCm = Number(normalizeMeasurementInput(widthValue));
  const price = Number(priceValue);

  if (
    !productId ||
    !title ||
    !brandId ||
    !categoryId ||
    !conditionId ||
    !sizeId ||
    !heightValue ||
    !widthValue ||
    !priceValue ||
    !description
  ) {
    return {
      message: "Completa todos los campos obligatorios.",
      success: false,
    };
  }

  if (
    !isValidMeasurementInput(heightValue, true) ||
    !isValidMeasurementInput(widthValue, true)
  ) {
    return {
      message: "Las medidas deben ser números mayores a cero y usar coma para decimales.",
      success: false,
    };
  }

  if (rawPriceValue !== priceValue) {
    return {
      message: "El precio solo permite números.",
      success: false,
    };
  }

  if (!Number.isFinite(price) || price <= 0) {
    return {
      message: "El precio debe ser un número mayor a cero.",
      success: false,
    };
  }

  if (description.length > PRODUCT_DESCRIPTION_MAX_LENGTH) {
    return {
      message: `La descripción puede tener como máximo ${PRODUCT_DESCRIPTION_MAX_LENGTH} caracteres.`,
      success: false,
    };
  }

  const catalogSelection = await getCatalogSelection({
    brandId,
    categoryId,
    conditionId,
    sizeId,
  });

  if (!catalogSelection.success) {
    return catalogSelection;
  }

  const { error } = await supabase
    .from("products")
    .update({
      title,
      brand_id: brandId,
      brand: catalogSelection.brand.name,
      category_id: categoryId,
      category: catalogSelection.category.slug,
      condition_id: conditionId,
      condition: catalogSelection.condition.name,
      size_id: sizeId,
      size: catalogSelection.size.value,
      height_cm: heightCm,
      width_cm: widthCm,
      price,
      description,
      is_exclusive: isExclusive,
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

async function getCatalogSelection({
  brandId,
  categoryId,
  conditionId,
  sizeId,
}: {
  brandId: string;
  categoryId: string;
  conditionId: string;
  sizeId: string;
}): Promise<
  | {
      brand: { id: string; name: string };
      category: {
        id: string;
        name: string;
        slug: string;
        sizes_letter_enabled: boolean;
        sizes_numeric_enabled: boolean;
      };
      condition: { id: string; name: string };
      size: { id: string; label: string; value: string };
      success: true;
    }
  | {
      message: string;
      success: false;
    }
> {
  const supabase = await createSupabaseServerClient();
  const [brandResult, categoryResult, conditionResult, sizeResult] = await Promise.all([
      supabase
        .from("catalog_brands")
        .select("id, name")
        .eq("id", brandId)
        .eq("is_active", true)
        .single(),
      supabase
        .from("catalog_categories")
        .select(
          "id, name, slug, sizes_letter_enabled, sizes_numeric_enabled",
        )
        .eq("id", categoryId)
        .eq("is_active", true)
        .single(),
      supabase
        .from("catalog_product_conditions")
        .select("id, name")
        .eq("id", conditionId)
        .eq("is_active", true)
        .single(),
      supabase
        .from("catalog_sizes")
        .select("id, label, value, size_group")
        .eq("id", sizeId)
        .eq("is_active", true)
        .single(),
    ]);

  if (brandResult.error || !brandResult.data) {
    return { message: "Selecciona una marca válida.", success: false };
  }

  if (categoryResult.error || !categoryResult.data) {
    return { message: "Selecciona una categoría válida.", success: false };
  }

  if (conditionResult.error || !conditionResult.data) {
    return { message: "Selecciona un estado válido.", success: false };
  }

  if (sizeResult.error || !sizeResult.data) {
    return { message: "Selecciona un talle válido.", success: false };
  }

  if (
    !categoryResult.data.sizes_letter_enabled &&
    !categoryResult.data.sizes_numeric_enabled
  ) {
    return {
      message: "La categoría no tiene talles habilitados.",
      success: false,
    };
  }

  const sizeGroup = sizeResult.data.size_group;
  const categoryAllowsSize =
    (sizeGroup === "letter" && categoryResult.data.sizes_letter_enabled) ||
    (sizeGroup === "numeric" && categoryResult.data.sizes_numeric_enabled);

  if (!categoryAllowsSize) {
    return {
      message: "El talle seleccionado no corresponde a esa categoría.",
      success: false,
    };
  }

  return {
    brand: brandResult.data,
    category: categoryResult.data,
    condition: conditionResult.data,
    size: sizeResult.data,
    success: true,
  };
}

async function validatePublishableInventoryItem(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  inventoryItemId: string,
): Promise<{ success: true } | { message: string; success: false }> {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("id, status")
    .eq("id", inventoryItemId)
    .single();

  if (error || !data) {
    return {
      message: "No se pudo validar el ingreso de stock vinculado.",
      success: false,
    };
  }

  if (data.status === "sold") {
    return {
      message: "Un producto vendido no puede publicarse en el catálogo.",
      success: false,
    };
  }

  return { success: true };
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
      message: "No tenés permisos para eliminar productos.",
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
      message: `No se pudieron buscar las imágenes: ${imagesQueryError.message}`,
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
        message: `No se pudieron eliminar las imágenes: ${storageError.message}`,
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
      message: `No se pudieron eliminar los registros de imágenes: ${imageRowsError.message}`,
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
      message: "No tenés permisos para eliminar imágenes.",
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
      message: `No se pudieron buscar las imágenes: ${imagesError.message}`,
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
        message: `La imagen se eliminó, pero no se pudieron reordenar las posiciones: ${error.message}`,
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
      message: "No tenés permisos para agregar imágenes.",
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
      message: `No se pudieron validar las imágenes actuales: ${currentImagesError.message}`,
      success: false,
    };
  }

  const currentImageCount = currentImages?.length ?? 0;

  if (currentImageCount + images.length > 5) {
    return {
      message: "El producto puede tener como máximo 5 imágenes.",
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
      message: `No se pudieron guardar las nuevas imágenes: ${error.message}`,
      success: false,
    };
  }

  return {
    message: "Imágenes agregadas correctamente.",
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
      message: "No tenés permisos para reordenar imágenes.",
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
      message: `No se pudieron validar las imágenes: ${currentImagesError.message}`,
      success: false,
    };
  }

  const currentImageIds = new Set((currentImages ?? []).map((image) => image.id));
  const hasInvalidImage = imagePositions.some(
    (image) => !currentImageIds.has(image.id),
  );

  if (hasInvalidImage || currentImageIds.size !== imagePositions.length) {
    return {
      message: "El orden enviado no coincide con las imágenes del producto.",
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
    message: "Orden de imágenes guardado correctamente.",
    success: true,
  };
}
