import { reorderItemsById } from "@/features/products/reorder-items";
import { describe, expect, it } from "vitest";

const items = [
  { id: "image-1", position: 1 },
  { id: "image-2", position: 2 },
  { id: "image-3", position: 3 },
];

describe("reorderItemsById", () => {
  it("moves an item after the target item", () => {
    const result = reorderItemsById(items, "image-1", "image-3");

    expect(result.map((item) => item.id)).toEqual([
      "image-2",
      "image-3",
      "image-1",
    ]);
  });

  it("moves an item before the target item", () => {
    const result = reorderItemsById(items, "image-3", "image-1");

    expect(result.map((item) => item.id)).toEqual([
      "image-3",
      "image-1",
      "image-2",
    ]);
  });

  it("returns the original reference when ids are invalid", () => {
    const result = reorderItemsById(items, "missing", "image-1");

    expect(result).toBe(items);
  });

  it("returns the original reference when the active and target ids match", () => {
    const result = reorderItemsById(items, "image-2", "image-2");

    expect(result).toBe(items);
  });
});
