import {
  validateInventoryFormFields,
  validateInventorySaleFormFields,
} from "@/features/inventory/validation";
import { describe, expect, it } from "vitest";

describe("inventory validation", () => {
  it("accepts a complete stock intake", () => {
    const formData = new FormData();
    formData.set("title", "Campera Nike azul");
    formData.set("category_id", "category-id");
    formData.set("condition_id", "condition-id");
    formData.set("purchase_date", "2026-08-03");
    formData.set("purchase_price", "$20.000");
    formData.set("estimated_sale_price", "$42.000");
    formData.set("internal_description", "Ingreso de feria.");

    const result = validateInventoryFormFields(formData);

    expect(result.firstInvalidField).toBeNull();
    expect(result.errors).toEqual({});
  });

  it("requires sale date, price and channel when selling", () => {
    const formData = new FormData();

    const result = validateInventorySaleFormFields(formData);

    expect(result.firstInvalidField).toBe("sold_at");
    expect(result.errors.sale_price).toBeTruthy();
    expect(result.errors.sale_channel_id).toBeTruthy();
  });
});
