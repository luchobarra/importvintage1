"use server";

import { isAdminUser } from "@/features/auth/admin";
import {
  validatePriceCalculatorSettings,
} from "@/features/price-calculator/calculations";
import {
  fromPercentInputValue,
  parseNumberInput,
} from "@/features/price-calculator/formatters";
import type {
  PriceCalculatorActionState,
  PriceCalculatorSettings,
} from "@/features/price-calculator/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updatePriceCalculatorSettings(
  formData: FormData,
): Promise<PriceCalculatorActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    return {
      message: "No tenes permisos para actualizar la calculadora.",
      success: false,
    };
  }

  const settings: PriceCalculatorSettings = {
    commissionRate: fromPercentInputValue(
      String(formData.get("commissionRate") ?? ""),
    ),
    finalRoundingIncrement: parseNumberInput(
      String(formData.get("finalRoundingIncrement") ?? ""),
    ),
    markupRate: fromPercentInputValue(String(formData.get("markupRate") ?? "")),
    packagingCost: parseNumberInput(String(formData.get("packagingCost") ?? "")),
    shippingCost: parseNumberInput(String(formData.get("shippingCost") ?? "")),
    vatRate: fromPercentInputValue(String(formData.get("vatRate") ?? "")),
  };

  if (Object.values(settings).some((value) => !Number.isFinite(value))) {
    return {
      message: "Todos los valores de configuracion deben ser numeros validos.",
      success: false,
    };
  }

  const validationError = validatePriceCalculatorSettings(settings);

  if (validationError) {
    return {
      message: validationError,
      success: false,
    };
  }

  const { error } = await supabase.from("price_calculator_settings").upsert({
    commission_rate: settings.commissionRate,
    final_rounding_increment: settings.finalRoundingIncrement,
    id: true,
    markup_rate: settings.markupRate,
    packaging_cost: settings.packagingCost,
    shipping_cost: settings.shippingCost,
    updated_at: new Date().toISOString(),
    vat_rate: settings.vatRate,
  });

  if (error) {
    if (isMissingSettingsTableError(error.message)) {
      return {
        message:
          "La calculadora funciona con valores por defecto, pero falta aplicar la migracion de Supabase para guardar cambios.",
        success: false,
      };
    }

    return {
      message: `No se pudieron actualizar los valores: ${error.message}`,
      success: false,
    };
  }

  revalidatePath("/oldtimes-admin/calculadora-precios");

  return {
    message: "Valores actualizados correctamente.",
    success: true,
  };
}

function isMissingSettingsTableError(message: string) {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("price_calculator_settings") &&
    (normalizedMessage.includes("does not exist") ||
      normalizedMessage.includes("schema cache") ||
      normalizedMessage.includes("not found"))
  );
}
