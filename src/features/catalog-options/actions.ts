"use server";

import { isAdminUser } from "@/features/auth/admin";
import type { CatalogOptionActionState } from "@/features/catalog-options/types";
import {
  createSizeValue,
  createSlug,
  normalizeCatalogOptionName,
  normalizeCatalogSizeGroup,
  validateCatalogOptionName,
  validateCatalogSizeValue,
  type CatalogOptionKind,
} from "@/features/catalog-options/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const successState: CatalogOptionActionState = {
  message: "Cambios guardados correctamente.",
  success: true,
};

export async function createCatalogOption(
  kind: CatalogOptionKind,
  formData: FormData,
): Promise<CatalogOptionActionState> {
  const adminError = await validateAdminAccess();

  if (adminError) {
    return adminError;
  }

  const rawName = String(formData.get("name") ?? "");
  const nameError = validateCatalogOptionName(kind, rawName);

  if (nameError) {
    return { message: nameError, success: false };
  }

  const supabase = await createSupabaseServerClient();
  const normalizedName = normalizeCatalogOptionName(rawName);
  const sizeGroup =
    kind === "size"
      ? normalizeCatalogSizeGroup(String(formData.get("sizeGroup") ?? ""))
      : null;
  const categorySizeFlags =
    kind === "category" ? getCategorySizeFlags(formData) : null;

  if (kind === "size" && !sizeGroup) {
    return { message: "Falta seleccionar el grupo del talle.", success: false };
  }

  if (kind === "category" && !categorySizeFlags?.hasAnyEnabled) {
    return {
      message: "Selecciona Letras, Numericos o ambos.",
      success: false,
    };
  }

  let error: { message: string } | null = null;

  if (kind === "size") {
    if (!sizeGroup) {
      return { message: "Falta seleccionar el grupo del talle.", success: false };
    }

    const nextSizePosition = await getNextSizePosition(sizeGroup);
    const result = await insertCatalogSize(
      supabase,
      normalizedName,
      nextSizePosition,
      sizeGroup,
    );
    error = result.error;
  } else if (kind === "category") {
    const result = await insertCatalogCategory(
      supabase,
      normalizedName,
      await getNextPosition(getCatalogOptionTableName(kind)),
      categorySizeFlags as CatalogCategorySizeFlags,
    );
    error = result.error;
  } else {
    const result = await supabase.from(getCatalogOptionTableName(kind)).insert({
      name: normalizedName,
      position: await getNextPosition(getCatalogOptionTableName(kind)),
      slug: createSlug(normalizedName),
    });
    error = result.error;
  }

  if (error) {
    return {
      message: getCatalogOptionErrorMessage(kind, error.message),
      success: false,
    };
  }

  revalidateCatalogOptionPaths();

  return successState;
}

export async function updateCatalogOption(
  kind: CatalogOptionKind,
  formData: FormData,
): Promise<CatalogOptionActionState> {
  const adminError = await validateAdminAccess();

  if (adminError) {
    return adminError;
  }

  const optionId = String(formData.get("id") ?? "");
  const rawName = String(formData.get("name") ?? "");
  const nameError = validateCatalogOptionName(kind, rawName);

  if (!optionId) {
    return { message: "Falta el ID de la opcion.", success: false };
  }

  if (nameError) {
    return { message: nameError, success: false };
  }

  const supabase = await createSupabaseServerClient();
  const normalizedName = normalizeCatalogOptionName(rawName);
  const categorySizeFlags =
    kind === "category" ? getCategorySizeFlags(formData) : null;
  const { error } =
    kind === "size"
      ? await updateCatalogSize(supabase, formData, optionId, normalizedName)
      : kind === "category"
        ? await updateCatalogCategory(
            supabase,
            optionId,
            normalizedName,
            categorySizeFlags as CatalogCategorySizeFlags,
          )
      : await supabase
          .from(getCatalogOptionTableName(kind))
          .update({
            name: normalizedName,
            slug: createSlug(normalizedName),
          })
          .eq("id", optionId);

  if (error) {
    return {
      message: getCatalogOptionErrorMessage(kind, error.message),
      success: false,
    };
  }

  revalidateCatalogOptionPaths();

  return successState;
}

export async function moveCatalogSizePosition(formData: FormData) {
  const adminError = await validateAdminAccess();

  if (adminError) {
    return adminError;
  }

  const sizeId = String(formData.get("sizeId") ?? "");
  const direction = String(formData.get("direction") ?? "");

  if (!sizeId) {
    return { message: "Falta el ID del talle.", success: false };
  }

  if (direction !== "up" && direction !== "down") {
    return { message: "Falta la direccion del movimiento.", success: false };
  }

  const supabase = await createSupabaseServerClient();
  const { data: currentSize, error: currentSizeError } = await supabase
    .from("catalog_sizes")
    .select("id, position, size_group")
    .eq("id", sizeId)
    .maybeSingle();

  if (currentSizeError) {
    return {
      message: `No se pudo mover el talle: ${currentSizeError.message}`,
      success: false,
    };
  }

  if (!currentSize) {
    return { message: "No se encontro el talle.", success: false };
  }

  const { data: sizesInGroup, error: groupError } = await supabase
    .from("catalog_sizes")
    .select("id, position, label")
    .eq("size_group", currentSize.size_group)
    .order("position", { ascending: true })
    .order("label", { ascending: true });

  if (groupError) {
    return {
      message: `No se pudo mover el talle: ${groupError.message}`,
      success: false,
    };
  }

  const currentIndex = (sizesInGroup ?? []).findIndex((size) => size.id === sizeId);
  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex === -1 || nextIndex < 0 || nextIndex >= (sizesInGroup ?? []).length) {
    return successState;
  }

  const targetSize = (sizesInGroup ?? [])[nextIndex];
  const currentPosition = currentSize.position;
  const targetPosition = targetSize.position;

  const { error: currentUpdateError } = await supabase
    .from("catalog_sizes")
    .update({ position: targetPosition })
    .eq("id", currentSize.id);

  if (currentUpdateError) {
    return {
      message: `No se pudo reordenar el talle: ${currentUpdateError.message}`,
      success: false,
    };
  }

  const { error: targetUpdateError } = await supabase
    .from("catalog_sizes")
    .update({ position: currentPosition })
    .eq("id", targetSize.id);

  if (targetUpdateError) {
    return {
      message: `No se pudo reordenar el talle: ${targetUpdateError.message}`,
      success: false,
    };
  }

  revalidateCatalogOptionPaths();

  return successState;
}

export async function updateCatalogSizePositions(
  sizeGroup: "letter" | "numeric",
  sizeIds: string[],
): Promise<CatalogOptionActionState> {
  const adminError = await validateAdminAccess();

  if (adminError) {
    return adminError;
  }

  if (sizeIds.length < 1) {
    return { message: "Faltan talles para reordenar.", success: false };
  }

  const supabase = await createSupabaseServerClient();
  const { data: sizesInGroup, error: sizesError } = await supabase
    .from("catalog_sizes")
    .select("id, label, position")
    .eq("size_group", sizeGroup)
    .order("position", { ascending: true })
    .order("label", { ascending: true });

  if (sizesError) {
    return {
      message: `No se pudo validar el orden actual: ${sizesError.message}`,
      success: false,
    };
  }

  const currentSizeIds = (sizesInGroup ?? []).map((size) => size.id);
  const hasMismatch =
    currentSizeIds.length !== sizeIds.length ||
    sizeIds.some((sizeId) => !currentSizeIds.includes(sizeId));

  if (hasMismatch) {
    return {
      message: "El orden enviado no coincide con los talles del grupo.",
      success: false,
    };
  }

  for (const [index, sizeId] of sizeIds.entries()) {
    const { error } = await supabase
      .from("catalog_sizes")
      .update({ position: (index + 1) * 10 })
      .eq("id", sizeId)
      .eq("size_group", sizeGroup);

    if (error) {
      return {
        message: `No se pudo guardar el nuevo orden: ${error.message}`,
        success: false,
      };
    }
  }

  revalidateCatalogOptionPaths();

  return successState;
}

export async function updateCatalogOptionPositions(
  kind: Exclude<CatalogOptionKind, "size">,
  optionIds: string[],
): Promise<CatalogOptionActionState> {
  const adminError = await validateAdminAccess();

  if (adminError) {
    return adminError;
  }

  if (optionIds.length < 1) {
    return { message: "Faltan opciones para reordenar.", success: false };
  }

  const tableName = getCatalogOptionTableName(kind);
  const supabase = await createSupabaseServerClient();
  const { data: options, error: optionsError } = await supabase
    .from(tableName)
    .select("id, position, name")
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  if (optionsError) {
    return {
      message: `No se pudo validar el orden actual: ${optionsError.message}`,
      success: false,
    };
  }

  const currentOptionIds = (options ?? []).map((option) => option.id);
  const hasMismatch =
    currentOptionIds.length !== optionIds.length ||
    optionIds.some((optionId) => !currentOptionIds.includes(optionId));

  if (hasMismatch) {
    return {
      message: "El orden enviado no coincide con las opciones del catalogo.",
      success: false,
    };
  }

  for (const [index, optionId] of optionIds.entries()) {
    const { error } = await supabase
      .from(tableName)
      .update({ position: (index + 1) * 10 })
      .eq("id", optionId);

    if (error) {
      return {
        message: `No se pudo guardar el nuevo orden: ${error.message}`,
        success: false,
      };
    }
  }

  revalidateCatalogOptionPaths();

  return successState;
}

export async function setCatalogOptionStatus(
  kind: CatalogOptionKind,
  formData: FormData,
): Promise<CatalogOptionActionState> {
  const adminError = await validateAdminAccess();

  if (adminError) {
    return adminError;
  }

  const optionId = String(formData.get("id") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!optionId) {
    return { message: "Falta el ID de la opcion.", success: false };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from(getCatalogOptionTableName(kind))
    .update({ is_active: isActive })
    .eq("id", optionId);

  if (error) {
    return {
      message: `No se pudo cambiar el estado: ${error.message}`,
      success: false,
    };
  }

  revalidateCatalogOptionPaths();

  return successState;
}

async function validateAdminAccess(): Promise<CatalogOptionActionState | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    return {
      message: "No tenes permisos para administrar el catalogo.",
      success: false,
    };
  }

  return null;
}

async function getNextPosition(tableName: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from(tableName)
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  return Number(data?.position ?? 0) + 10;
}

type CatalogCategorySizeFlags = {
  hasAnyEnabled: boolean;
  letter: boolean;
  numeric: boolean;
};

function getCategorySizeFlags(formData: FormData): CatalogCategorySizeFlags {
  const letter = formData.get("sizesLetterEnabled") !== null;
  const numeric = formData.get("sizesNumericEnabled") !== null;

  return {
    hasAnyEnabled: letter || numeric,
    letter,
    numeric,
  };
}

async function insertCatalogCategory(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  normalizedName: string,
  nextPosition: number,
  sizeFlags: CatalogCategorySizeFlags,
) {
  return supabase.from("catalog_categories").insert({
    name: normalizedName,
    position: nextPosition,
    slug: createSlug(normalizedName),
    sizes_letter_enabled: sizeFlags.letter,
    sizes_numeric_enabled: sizeFlags.numeric,
  });
}

async function updateCatalogCategory(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  optionId: string,
  normalizedName: string,
  sizeFlags: CatalogCategorySizeFlags,
) {
  if (!sizeFlags.hasAnyEnabled) {
    return {
      error: { message: "Selecciona Letras, Numericos o ambos." },
    };
  }

  return supabase
    .from("catalog_categories")
    .update({
      name: normalizedName,
      slug: createSlug(normalizedName),
      sizes_letter_enabled: sizeFlags.letter,
      sizes_numeric_enabled: sizeFlags.numeric,
    })
    .eq("id", optionId);
}

async function getNextSizePosition(sizeGroup: "letter" | "numeric") {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("catalog_sizes")
    .select("position")
    .eq("size_group", sizeGroup)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  return Number(data?.position ?? 0) + 10;
}

async function insertCatalogSize(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  normalizedName: string,
  nextPosition: number,
  sizeGroup: "letter" | "numeric",
) {
  const value = createSizeValue(normalizedName);
  const groupError = validateCatalogSizeValue(value, sizeGroup);

  if (groupError) {
    return {
      error: { message: groupError },
    };
  }

  return supabase.from("catalog_sizes").insert({
    label: value,
    position: nextPosition,
    size_group: sizeGroup,
    value,
  });
}

async function updateCatalogSize(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  formData: FormData,
  optionId: string,
  normalizedName: string,
) {
  const sizeGroup = normalizeCatalogSizeGroup(
    String(formData.get("sizeGroup") ?? ""),
  );

  if (!sizeGroup) {
    return {
      error: { message: "Falta seleccionar el grupo del talle." },
    };
  }

  const group = sizeGroup;
  const value = createSizeValue(normalizedName);
  const groupError = validateCatalogSizeValue(value, group);

  if (groupError) {
    return {
      error: { message: groupError },
    };
  }

  const { data: currentSize, error: currentSizeError } = await supabase
    .from("catalog_sizes")
    .select("size_group")
    .eq("id", optionId)
    .maybeSingle();

  if (currentSizeError) {
    return { error: currentSizeError };
  }

  const nextPosition =
    currentSize?.size_group === group
      ? undefined
      : await getNextSizePosition(group);

  const updatePayload: {
    label: string;
    size_group: "letter" | "numeric";
    value: string;
    position?: number;
  } = {
    label: value,
    size_group: group,
    value,
  };

  if (nextPosition !== undefined) {
    updatePayload.position = nextPosition;
  }

  return supabase
    .from("catalog_sizes")
    .update(updatePayload)
    .eq("id", optionId);
}

function getCatalogOptionTableName(kind: CatalogOptionKind) {
  if (kind === "brand") {
    return "catalog_brands";
  }

  if (kind === "condition") {
    return "catalog_product_conditions";
  }

  if (kind === "category") {
    return "catalog_categories";
  }

  return "catalog_sizes";
}

function getCatalogOptionErrorMessage(
  kind: CatalogOptionKind,
  errorMessage: string,
) {
  if (errorMessage.toLowerCase().includes("duplicate")) {
    return `Ya existe esa ${kind === "size" ? "opcion" : "opcion"}.`;
  }

  return `No se pudo guardar la opcion: ${errorMessage}`;
}

function revalidateCatalogOptionPaths() {
  revalidatePath("/");
  revalidatePath("/oldtimes-admin/catalogo");
  revalidatePath("/oldtimes-admin/productos");
  revalidatePath("/oldtimes-admin/productos/nuevo");
}
