import {
  calculateEstimatedSaleMetrics,
  calculateProductPrice,
  DEFAULT_PRICE_CALCULATOR_SETTINGS,
  roundUpToIncrement,
} from "@/features/price-calculator/calculations";
import { describe, expect, it } from "vitest";

describe("price calculator", () => {
  it("replicates the spreadsheet calculation for a loaded product", () => {
    const result = calculateProductPrice({
      acquisitionCost: 25000,
      settings: DEFAULT_PRICE_CALCULATOR_SETTINGS,
    });

    expect(result.costTotal).toBe(27500);
    expect(result.salePrice).toBe(44000);
    expect(result.contributionMargin).toBe(16500);
    expect(result.contributionMarginRate).toBe(0.375);
    expect(result.priceWithVat).toBe(53240);
  });

  it("includes commission before VAT and rounds only the final price", () => {
    const result = calculateProductPrice({
      acquisitionCost: 25000,
      settings: {
        ...DEFAULT_PRICE_CALCULATOR_SETTINGS,
        commissionRate: 0.1,
        finalRoundingIncrement: 500,
      },
    });

    expect(result.salePrice).toBe(44000);
    expect(result.priceWithCommission).toBeCloseTo(48888.8889);
    expect(result.contributionMarginWithCommission).toBeCloseTo(16500);
    expect(result.contributionMarginWithCommissionRate).toBe(0.375);
    expect(result.finalPriceWithCommissionVat).toBeCloseTo(59155.5556);
    expect(result.finalRoundedPrice).toBe(59500);
  });

  it("rounds up to the configured increment", () => {
    expect(roundUpToIncrement(43982, 100)).toBe(44000);
    expect(roundUpToIncrement(44000, 100)).toBe(44000);
  });

  it("calculates real margin from a manual estimated sale price", () => {
    const result = calculateEstimatedSaleMetrics({
      acquisitionCost: 25000,
      estimatedSalePrice: 60500,
      settings: {
        ...DEFAULT_PRICE_CALCULATOR_SETTINGS,
        commissionRate: 0.1,
        finalRoundingIncrement: 500,
      },
    });

    expect(result.costTotal).toBe(27500);
    expect(result.netSalePrice).toBeCloseTo(45000);
    expect(result.contributionMarginWithCommission).toBeCloseTo(17500);
    expect(result.contributionMarginWithCommissionRate).toBeCloseTo(0.3889, 4);
  });
});
