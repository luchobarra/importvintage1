import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import type { CatalogOptions } from "@/features/catalog-options/types";
import {
  emptyPublicCatalogState,
  parsePublicCatalogState,
} from "@/features/products/public-filters";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const testCatalogOptions: CatalogOptions = {
  brands: [
    {
      id: "brand-1",
      is_active: true,
      name: "Vintage",
      position: 1,
      slug: "vintage",
    },
  ],
  categories: [
    {
      id: "category-1",
      is_active: true,
      name: "Buzos",
      position: 1,
      slug: "buzos",
      sizes_letter_enabled: true,
      sizes_numeric_enabled: false,
    },
  ],
  sizes: [
    {
      id: "size-1",
      is_active: true,
      label: "L",
      position: 1,
      size_group: "letter",
      value: "L",
    },
  ],
};

describe("CatalogFilters", () => {
  it("renders public catalog filter fields as GET params", () => {
    render(
      <CatalogFilters
        hasActiveControls
        options={testCatalogOptions}
        state={{
          ...emptyPublicCatalogState,
          brand: "vintage",
          category: "buzos",
          size: "L",
          sort: "price_asc",
        }}
      />,
    );

    expect(screen.getByLabelText("Marca")).toHaveAttribute("name", "brand");
    expect(screen.getByLabelText("Categoria")).toHaveAttribute(
      "name",
      "category",
    );
    expect(screen.getByLabelText("Talle")).toHaveAttribute("name", "size");
    expect(screen.getByLabelText("Ordenar")).toHaveAttribute("name", "sort");
    expect(screen.getByLabelText("Ordenar")).toHaveValue("price_asc");
    expect(
      screen.getByRole("button", { name: "Aplicar filtros" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Limpiar filtros" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("disables the clear action when there are no active controls", () => {
    render(
      <CatalogFilters
        hasActiveControls={false}
        options={testCatalogOptions}
        state={emptyPublicCatalogState}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Limpiar filtros" }),
    ).toBeDisabled();
  });
});

describe("parsePublicCatalogState", () => {
  it("normalizes supported query params", () => {
    expect(
      parsePublicCatalogState({
        brand: " import ",
        category: "buzos",
        size: " l ",
        page: "2",
        sort: "price_desc",
      }),
    ).toEqual({
      brand: "import",
      category: "buzos",
      size: "L",
      page: 2,
      sort: "price_desc",
    });
  });

  it("normalizes unsupported pages and sort values", () => {
    expect(
      parsePublicCatalogState({
        category: "camisas",
        page: "-1",
        sort: "oldest",
      }),
    ).toEqual({
      ...emptyPublicCatalogState,
      category: "camisas",
    });
  });
});
