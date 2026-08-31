import type {
  EstimatedSaleMetricsInput,
  EstimatedSaleMetricsResult,
  PriceCalculationInput,
  PriceCalculationResult,
  PriceCalculatorSettings,
} from "@/features/price-calculator/types";

export const DEFAULT_PRICE_CALCULATOR_SETTINGS: PriceCalculatorSettings = {
  commissionRate: 0,
  finalRoundingIncrement: 100,
  markupRate: 0.6,
  packagingCost: 1000,
  shippingCost: 1500,
  vatRate: 0.21,
};

export function calculateProductPrice({
  acquisitionCost,
  settings,
}: PriceCalculationInput): PriceCalculationResult {
  const costTotal =
    acquisitionCost + settings.packagingCost + settings.shippingCost;
  const salePrice = costTotal * (1 + settings.markupRate);
  const priceWithVat = salePrice * (1 + settings.vatRate);
  const contributionMargin = salePrice - costTotal;
  const contributionMarginRate =
    salePrice > 0 ? contributionMargin / salePrice : null;
  const priceWithCommission =
    settings.commissionRate < 1
      ? salePrice / (1 - settings.commissionRate)
      : 0;
  const contributionMarginWithCommission =
    priceWithCommission -
    priceWithCommission * settings.commissionRate -
    costTotal;
  const contributionMarginWithCommissionRate =
    salePrice > 0 ? contributionMarginWithCommission / salePrice : null;
  const finalPriceWithCommissionVat =
    priceWithCommission * (1 + settings.vatRate);

  return {
    contributionMargin,
    contributionMarginRate,
    contributionMarginWithCommission,
    contributionMarginWithCommissionRate,
    costTotal,
    finalPriceWithCommissionVat,
    finalRoundedPrice: roundUpToIncrement(
      finalPriceWithCommissionVat,
      settings.finalRoundingIncrement,
    ),
    priceWithCommission,
    priceWithVat,
    salePrice,
  };
}

export function calculateEstimatedSaleMetrics({
  acquisitionCost,
  estimatedSalePrice,
  settings,
}: EstimatedSaleMetricsInput): EstimatedSaleMetricsResult {
  const costTotal =
    acquisitionCost + settings.packagingCost + settings.shippingCost;
  const priceBeforeVat =
    settings.vatRate > -1 ? estimatedSalePrice / (1 + settings.vatRate) : 0;
  const netSalePrice = priceBeforeVat * (1 - settings.commissionRate);
  const contributionMarginWithCommission = netSalePrice - costTotal;
  const contributionMarginWithCommissionRate =
    netSalePrice > 0 ? contributionMarginWithCommission / netSalePrice : null;

  return {
    contributionMarginWithCommission,
    contributionMarginWithCommissionRate,
    costTotal,
    netSalePrice,
  };
}

export function roundUpToIncrement(value: number, increment: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  if (!Number.isFinite(increment) || increment <= 1) {
    return Math.ceil(value);
  }

  return Math.ceil(value / increment) * increment;
}

export function validatePriceCalculatorSettings(
  settings: PriceCalculatorSettings,
) {
  if (settings.packagingCost < 0 || settings.shippingCost < 0) {
    return "Packaging y envío no pueden ser negativos.";
  }

  if (settings.markupRate < 0) {
    return "El margen de marcación no puede ser negativo.";
  }

  if (settings.commissionRate < 0 || settings.commissionRate >= 1) {
    return "La comision debe ser menor al 100%.";
  }

  if (settings.vatRate < 0) {
    return "El IVA no puede ser negativo.";
  }

  if (
    !Number.isInteger(settings.finalRoundingIncrement) ||
    settings.finalRoundingIncrement < 1
  ) {
    return "El redondeo final debe ser un número entero mayor a cero.";
  }

  return "";
}
