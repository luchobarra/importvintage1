import { isAdminUser } from "@/features/auth/admin";
import { DEFAULT_PRICE_CALCULATOR_SETTINGS } from "@/features/price-calculator/calculations";
import type { PriceCalculatorSettings } from "@/features/price-calculator/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PriceCalculatorSettingsRow = {
  commission_rate: number | string;
  final_rounding_increment: number;
  markup_rate: number | string;
  packaging_cost: number | string;
  shipping_cost: number | string;
  vat_rate: number | string;
};

export async function getAdminPriceCalculatorSettings(): Promise<PriceCalculatorSettings> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    throw new Error("No tenés permisos para usar la calculadora.");
  }

  const { data, error } = await supabase
    .from("price_calculator_settings")
    .select(
      "packaging_cost, shipping_cost, markup_rate, commission_rate, vat_rate, final_rounding_increment",
    )
    .eq("id", true)
    .maybeSingle();

  if (error) {
    if (isMissingSettingsTableError(error.message)) {
      return DEFAULT_PRICE_CALCULATOR_SETTINGS;
    }

    throw new Error(`No se pudo cargar la configuración: ${error.message}`);
  }

  if (!data) {
    return DEFAULT_PRICE_CALCULATOR_SETTINGS;
  }

  return mapSettingsRow(data as PriceCalculatorSettingsRow);
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

function mapSettingsRow(
  row: PriceCalculatorSettingsRow,
): PriceCalculatorSettings {
  return {
    commissionRate: Number(row.commission_rate),
    finalRoundingIncrement: Number(row.final_rounding_increment),
    markupRate: Number(row.markup_rate),
    packagingCost: Number(row.packaging_cost),
    shippingCost: Number(row.shipping_cost),
    vatRate: Number(row.vat_rate),
  };
}
