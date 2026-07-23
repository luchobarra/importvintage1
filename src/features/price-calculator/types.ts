export type PriceCalculatorSettings = {
  commissionRate: number;
  finalRoundingIncrement: number;
  markupRate: number;
  packagingCost: number;
  shippingCost: number;
  vatRate: number;
};

export type PriceCalculationInput = {
  acquisitionCost: number;
  settings: PriceCalculatorSettings;
};

export type PriceCalculationResult = {
  contributionMargin: number;
  contributionMarginRate: number | null;
  contributionMarginWithCommission: number;
  contributionMarginWithCommissionRate: number | null;
  costTotal: number;
  finalPriceWithCommissionVat: number;
  finalRoundedPrice: number;
  priceWithCommission: number;
  priceWithVat: number;
  salePrice: number;
};

export type PriceCalculatorActionState = {
  message: string;
  success: boolean;
};
