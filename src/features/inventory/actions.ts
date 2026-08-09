"use server";

import { isAdminUser } from "@/features/auth/admin";
import {
  INVENTORY_NOTES_MAX_LENGTH,
  INVENTORY_TEXT_MAX_LENGTH,
  MAX_INVENTORY_IMAGES,
} from "@/features/inventory/constants";
import type {
  InventoryImageInput,
  InventoryMovementType,
} from "@/features/inventory/types";
import { normalizeMoneyInput } from "@/features/inventory/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type InventoryFormState = {
  message: string;
  success: boolean;
};

type InventoryActionError = {
  message: string;
  success: false;
};

export type CreateInventoryDraftResult =
  | {
      inventoryItemId: string;
      success: true;
    }
  | {
      message: string;
      success: false;
    };

export async function createInventoryItemDraft(
  formData: FormData,
): Promise<CreateInventoryDraftResult> {
  const supabase = await createAuthorizedSupabaseClient(
    "No tenes permisos para cargar stock.",
  );

  const parsed = parseInventoryPayload(formData);

  if (!parsed.success) {
    return parsed;
  }

  const categoryValidation = await validateInventoryCategory(
    supabase,
    parsed.values.category_id,
  );
  const conditionValidation = await validateInventoryCondition(
    supabase,
    parsed.values.condition_id,
  );
  const brandValidation = await validateInventoryBrand(
    supabase,
    parsed.values.brand_id,
  );

  if (!categoryValidation.success) {
    return categoryValidation;
  }

  if (!conditionValidation.success) {
    return conditionValidation;
  }

  if (!brandValidation.success) {
    return brandValidation;
  }

  const { data, error } = await supabase
    .from("inventory_items")
    .insert(parsed.values)
    .select("id")
    .single();

  if (error) {
    return {
      message: `No se pudo cargar el ingreso: ${error.message}`,
      success: false,
    };
  }

  await createInventoryMovement(supabase, {
    eventType: "created",
    inventoryItemId: data.id,
    title: "Ingreso cargado",
  });

  revalidateStockPaths();

  return {
    inventoryItemId: data.id,
    success: true,
  };
}

export async function updateInventoryItem(
  inventoryItemId: string,
  formData: FormData,
): Promise<InventoryFormState> {
  const supabase = await createAuthorizedSupabaseClient(
    "No tenes permisos para editar stock.",
  );

  if (!inventoryItemId) {
    return {
      message: "Falta el ID del producto de stock.",
      success: false,
    };
  }

  const parsed = parseInventoryPayload(formData);

  if (!parsed.success) {
    return parsed;
  }

  const categoryValidation = await validateInventoryCategory(
    supabase,
    parsed.values.category_id,
  );
  const conditionValidation = await validateInventoryCondition(
    supabase,
    parsed.values.condition_id,
  );
  const brandValidation = await validateInventoryBrand(
    supabase,
    parsed.values.brand_id,
  );

  if (!categoryValidation.success) {
    return categoryValidation;
  }

  if (!conditionValidation.success) {
    return conditionValidation;
  }

  if (!brandValidation.success) {
    return brandValidation;
  }

  const { error } = await supabase
    .from("inventory_items")
    .update(parsed.values)
    .eq("id", inventoryItemId);

  if (error) {
    return {
      message: `No se pudo guardar el ingreso: ${error.message}`,
      success: false,
    };
  }

  await createInventoryMovement(supabase, {
    eventType: "updated",
    inventoryItemId,
    title: "Datos actualizados",
  });

  revalidateStockPaths(inventoryItemId);

  return {
    message: "Ingreso actualizado correctamente.",
    success: true,
  };
}

export async function saveInventoryItemImages(
  inventoryItemId: string,
  images: InventoryImageInput[],
): Promise<InventoryFormState> {
  const supabase = await createAuthorizedSupabaseClient(
    "No tenes permisos para guardar imagenes de stock.",
  );

  if (!inventoryItemId || images.length < 1 || images.length > MAX_INVENTORY_IMAGES) {
    return {
      message: `La cantidad de imagenes debe ser entre 1 y ${MAX_INVENTORY_IMAGES}.`,
      success: false,
    };
  }

  const imageRows = images.map((image) => ({
    inventory_item_id: inventoryItemId,
    image_path: image.imagePath,
    image_url: image.imageUrl,
    position: image.position,
  }));

  const { error } = await supabase
    .from("inventory_item_images")
    .insert(imageRows);

  if (error) {
    return {
      message: `No se pudieron guardar las imagenes: ${error.message}`,
      success: false,
    };
  }

  revalidateStockPaths(inventoryItemId);

  return {
    message: "Ingreso cargado correctamente.",
    success: true,
  };
}

export async function deleteInventoryItemDraft(inventoryItemId: string) {
  const supabase = await createAuthorizedSupabaseClient(
    "No tenes permisos para descartar el ingreso.",
  );

  if (!inventoryItemId) {
    return;
  }

  await supabase.from("inventory_items").delete().eq("id", inventoryItemId);
  revalidateStockPaths();
}

export async function deleteInventoryItem(
  inventoryItemId: string,
): Promise<InventoryFormState> {
  const supabase = await createAuthorizedSupabaseClient(
    "No tenes permisos para eliminar ingresos.",
  );

  if (!inventoryItemId) {
    return {
      message: "Falta el ID del ingreso a eliminar.",
      success: false,
    };
  }

  const { data: images, error: imagesQueryError } = await supabase
    .from("inventory_item_images")
    .select("image_path")
    .eq("inventory_item_id", inventoryItemId);

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

  const { error } = await supabase
    .from("inventory_items")
    .delete()
    .eq("id", inventoryItemId);

  if (error) {
    return {
      message: `No se pudo eliminar el ingreso: ${error.message}`,
      success: false,
    };
  }

  revalidateStockPaths(inventoryItemId);

  return {
    message: "Ingreso eliminado correctamente.",
    success: true,
  };
}

export async function markInventoryItemAsSold(
  inventoryItemId: string,
  formData: FormData,
): Promise<InventoryFormState> {
  const supabase = await createAuthorizedSupabaseClient(
    "No tenes permisos para marcar ventas.",
  );

  const soldAt = String(formData.get("sold_at") ?? "").trim();
  const salePriceValue = normalizeMoneyInput(formData.get("sale_price"));
  const saleChannelId = String(formData.get("sale_channel_id") ?? "").trim();
  const saleNotes = String(formData.get("sale_notes") ?? "").trim();
  const salePrice = Number(salePriceValue);

  if (!inventoryItemId || !soldAt || !salePriceValue || !saleChannelId) {
    return {
      message: "Completa fecha, precio y medio de venta.",
      success: false,
    };
  }

  if (!isDateInput(soldAt)) {
    return {
      message: "Selecciona una fecha de venta valida.",
      success: false,
    };
  }

  if (!Number.isFinite(salePrice) || salePrice < 0) {
    return {
      message: "El precio de venta debe ser un numero valido.",
      success: false,
    };
  }

  if (saleNotes.length > INVENTORY_NOTES_MAX_LENGTH) {
    return {
      message: `Las notas pueden tener como maximo ${INVENTORY_NOTES_MAX_LENGTH} caracteres.`,
      success: false,
    };
  }

  const { data: channel, error: channelError } = await supabase
    .from("sales_channels")
    .select("id")
    .eq("id", saleChannelId)
    .eq("is_active", true)
    .single();

  if (channelError || !channel) {
    return {
      message: "Selecciona un medio de venta valido.",
      success: false,
    };
  }

  const { error } = await supabase
    .from("inventory_items")
    .update({
      reservation_channel_id: null,
      reservation_customer: null,
      reservation_expires_at: null,
      reservation_notes: null,
      reserved_at: null,
      sale_channel_id: saleChannelId,
      sale_notes: saleNotes || null,
      sale_price: salePrice,
      sold_at: soldAt,
      status: "sold",
    })
    .eq("id", inventoryItemId);

  if (error) {
    return {
      message: `No se pudo marcar como vendido: ${error.message}`,
      success: false,
    };
  }

  await createInventoryMovement(supabase, {
    eventType: "sold",
    inventoryItemId,
    notes: saleNotes || null,
    title: "Venta registrada",
  });

  await supabase
    .from("products")
    .update({ status: "sold" })
    .eq("inventory_item_id", inventoryItemId);

  revalidateStockPaths(inventoryItemId);
  revalidatePath("/");

  return {
    message: "Producto marcado como vendido correctamente.",
    success: true,
  };
}

export async function setInventoryItemReserved(
  inventoryItemId: string,
  formData: FormData,
): Promise<InventoryFormState> {
  const supabase = await createAuthorizedSupabaseClient(
    "No tenes permisos para administrar reservas.",
  );

  if (!inventoryItemId) {
    return {
      message: "Falta el ID del producto de stock.",
      success: false,
    };
  }

  const reserveMode = String(formData.get("reserve_mode") ?? "").trim();

  if (reserveMode !== "reserved" && reserveMode !== "available") {
    return {
      message: "Selecciona una accion de reserva valida.",
      success: false,
    };
  }

  const isReserved = reserveMode === "reserved";
  const reservedAt = String(formData.get("reserved_at") ?? "").trim();
  const reservationChannelId = String(
    formData.get("reservation_channel_id") ?? "",
  ).trim();
  const reservationCustomer = String(
    formData.get("reservation_customer") ?? "",
  ).trim();
  const reservationExpiresAt = String(
    formData.get("reservation_expires_at") ?? "",
  ).trim();
  const reservationNotes = String(
    formData.get("reservation_notes") ?? "",
  ).trim();

  if (isReserved && (!reservedAt || !isDateInput(reservedAt))) {
    return {
      message: "Selecciona una fecha de reserva valida.",
      success: false,
    };
  }

  if (reservationExpiresAt && !isDateInput(reservationExpiresAt)) {
    return {
      message: "Selecciona un vencimiento de reserva valido.",
      success: false,
    };
  }

  if (
    reservationCustomer.length > INVENTORY_TEXT_MAX_LENGTH ||
    reservationNotes.length > INVENTORY_NOTES_MAX_LENGTH
  ) {
    return {
      message: "Los datos de reserva superan el maximo permitido.",
      success: false,
    };
  }

  const { data: item, error: itemError } = await supabase
    .from("inventory_items")
    .select("id, status")
    .eq("id", inventoryItemId)
    .single();

  if (itemError || !item) {
    return {
      message: "No se pudo encontrar el producto de stock.",
      success: false,
    };
  }

  if (item.status === "sold") {
    return {
      message: "Un producto vendido no puede marcarse como reservado.",
      success: false,
    };
  }

  if (isReserved && reservationChannelId) {
    const { data: channel, error: channelError } = await supabase
      .from("sales_channels")
      .select("id")
      .eq("id", reservationChannelId)
      .eq("is_active", true)
      .single();

    if (channelError || !channel) {
      return {
        message: "Selecciona un canal de reserva valido.",
        success: false,
      };
    }
  }

  const { error } = await supabase
    .from("inventory_items")
    .update({
      reservation_channel_id:
        isReserved && reservationChannelId ? reservationChannelId : null,
      reservation_customer:
        isReserved && reservationCustomer ? reservationCustomer : null,
      reservation_expires_at:
        isReserved && reservationExpiresAt ? reservationExpiresAt : null,
      reservation_notes: isReserved && reservationNotes ? reservationNotes : null,
      reserved_at: isReserved ? reservedAt : null,
      sale_channel_id: null,
      sale_notes: null,
      sale_price: null,
      sold_at: null,
      status: isReserved ? "reserved" : "available",
    })
    .eq("id", inventoryItemId);

  if (error) {
    return {
      message: `No se pudo actualizar la reserva: ${error.message}`,
      success: false,
    };
  }

  await createInventoryMovement(supabase, {
    eventType: isReserved ? "reserved" : "available",
    inventoryItemId,
    notes: isReserved ? reservationNotes || null : null,
    title: isReserved ? "Producto reservado" : "Producto disponible",
  });

  revalidateStockPaths(inventoryItemId);

  return {
    message: isReserved
      ? "Producto marcado como reservado."
      : "Producto marcado como disponible.",
    success: true,
  };
}

export async function createSalesChannel(
  formData: FormData,
): Promise<InventoryFormState> {
  const supabase = await createAuthorizedSupabaseClient(
    "No tenes permisos para administrar medios de venta.",
  );

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return {
      message: "Ingresa el nombre del medio de venta.",
      success: false,
    };
  }

  const slug = slugify(name);

  const { count, error: countError } = await supabase
    .from("sales_channels")
    .select("id", { count: "exact", head: true });

  if (countError) {
    return {
      message: `No se pudo calcular la posicion: ${countError.message}`,
      success: false,
    };
  }

  const { error } = await supabase.from("sales_channels").insert({
    name,
    position: ((count ?? 0) + 1) * 10,
    slug,
  });

  if (error) {
    return {
      message: `No se pudo crear el medio: ${error.message}`,
      success: false,
    };
  }

  revalidatePath("/oldtimes-admin/stock/canales");

  return {
    message: "Medio de venta creado correctamente.",
    success: true,
  };
}

export async function toggleSalesChannel(
  channelId: string,
  isActive: boolean,
): Promise<InventoryFormState> {
  const supabase = await createAuthorizedSupabaseClient(
    "No tenes permisos para administrar medios de venta.",
  );

  const { error } = await supabase
    .from("sales_channels")
    .update({ is_active: isActive })
    .eq("id", channelId);

  if (error) {
    return {
      message: `No se pudo actualizar el medio: ${error.message}`,
      success: false,
    };
  }

  revalidatePath("/oldtimes-admin/stock");
  revalidatePath("/oldtimes-admin/stock/canales");

  return {
    message: "Medio de venta actualizado correctamente.",
    success: true,
  };
}

function parseInventoryPayload(formData: FormData):
  | {
      success: true;
      values: {
        brand_id: string | null;
        category_id: string;
        condition_id: string;
        condition_notes: string;
        estimated_sale_price: number | null;
        internal_description: string;
        internal_notes: string | null;
        purchase_date: string;
        purchase_price: number;
        title: string;
      };
    }
  | InventoryActionError {
  const title = String(formData.get("title") ?? "").trim();
  const brandId = String(formData.get("brand_id") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const conditionId = String(formData.get("condition_id") ?? "").trim();
  const purchaseDate = String(formData.get("purchase_date") ?? "").trim();
  const purchasePriceValue = normalizeMoneyInput(formData.get("purchase_price"));
  const estimatedSalePriceValue = normalizeMoneyInput(
    formData.get("estimated_sale_price"),
  );
  const internalDescription = String(
    formData.get("internal_description") ?? "",
  ).trim();
  const internalNotes = String(formData.get("internal_notes") ?? "").trim();
  const purchasePrice = Number(purchasePriceValue);
  const estimatedSalePrice = estimatedSalePriceValue
    ? Number(estimatedSalePriceValue)
    : null;

  if (
    !title ||
    !categoryId ||
    !conditionId ||
    !purchaseDate ||
    !purchasePriceValue ||
    !internalDescription
  ) {
    return {
      message: "Completa los campos obligatorios del ingreso.",
      success: false,
    };
  }

  if (!isDateInput(purchaseDate)) {
    return {
      message: "Selecciona una fecha de compra valida.",
      success: false,
    };
  }

  if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
    return {
      message: "El precio de compra debe ser un numero valido.",
      success: false,
    };
  }

  if (
    estimatedSalePrice !== null &&
    (!Number.isFinite(estimatedSalePrice) || estimatedSalePrice < 0)
  ) {
    return {
      message: "El precio estimado debe ser un numero valido.",
      success: false,
    };
  }

  if (
    internalDescription.length > INVENTORY_TEXT_MAX_LENGTH ||
    internalNotes.length > INVENTORY_NOTES_MAX_LENGTH
  ) {
    return {
      message: "Hay textos internos que superan el maximo permitido.",
      success: false,
    };
  }

  return {
    success: true,
    values: {
      brand_id: brandId || null,
      category_id: categoryId,
      condition_id: conditionId,
      condition_notes: "",
      estimated_sale_price: estimatedSalePrice,
      internal_description: internalDescription,
      internal_notes: internalNotes || null,
      purchase_date: purchaseDate,
      purchase_price: purchasePrice,
      title,
    },
  };
}

async function validateInventoryBrand(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  brandId: string | null,
): Promise<{ success: true } | InventoryActionError> {
  if (!brandId) {
    return { success: true };
  }

  const { data, error } = await supabase
    .from("catalog_brands")
    .select("id")
    .eq("id", brandId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return {
      message: "Selecciona una marca activa.",
      success: false,
    };
  }

  return { success: true };
}

async function createInventoryMovement(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  {
    eventType,
    inventoryItemId,
    notes = null,
    title,
  }: {
    eventType: InventoryMovementType;
    inventoryItemId: string;
    notes?: string | null;
    title: string;
  },
) {
  await supabase.from("inventory_item_movements").insert({
    event_type: eventType,
    inventory_item_id: inventoryItemId,
    notes,
    title,
  });
}

async function validateInventoryCategory(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  categoryId: string,
): Promise<{ success: true } | InventoryActionError> {
  if (!categoryId) {
    return {
      message: "Selecciona una categoria valida.",
      success: false,
    };
  }

  const { data, error } = await supabase
    .from("catalog_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return {
      message: "Selecciona una categoria activa.",
      success: false,
    };
  }

  return { success: true };
}

async function validateInventoryCondition(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  conditionId: string,
): Promise<{ success: true } | InventoryActionError> {
  if (!conditionId) {
    return {
      message: "Selecciona un estado valido.",
      success: false,
    };
  }

  const { data, error } = await supabase
    .from("catalog_product_conditions")
    .select("id")
    .eq("id", conditionId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return {
      message: "Selecciona un estado activo.",
      success: false,
    };
  }

  return { success: true };
}

async function createAuthorizedSupabaseClient(errorMessage: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    throw new Error(errorMessage);
  }

  return supabase;
}

function revalidateStockPaths(inventoryItemId?: string) {
  revalidatePath("/oldtimes-admin");
  revalidatePath("/oldtimes-admin/stock");

  if (inventoryItemId) {
    revalidatePath(`/oldtimes-admin/stock/${inventoryItemId}`);
  }
}

function isDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
