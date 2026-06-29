import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import type { CatalogOptions } from "@/features/catalog-options/types";
import {
  emptyPublicCatalogState,
  parsePublicCatalogState,
} from "@/features/products/public-filters";
import { fireEvent, render, screen, within } from "@testing-library/react";
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
  conditions: [
    {
      id: "condition-1",
      is_active: true,
      name: "Muy bueno",
      position: 1,
      slug: "muy-bueno",
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
        exclusive: true,
        recent: true,
        size: "L",
        sort: "price_asc",
      }}
    />,
    );

    expect(screen.getByRole("button", { name: "Filtrar" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Filtrar" }));

    const drawer = within(
      screen.getByRole("dialog", { name: "Filtros del catalogo" }),
    );
    const brandGroup = within(drawer.getByRole("group", { name: "Marca" }));
    const categoryGroup = within(drawer.getByRole("group", { name: "Categoria" }));
    const sizeGroup = within(drawer.getByRole("group", { name: "Talle" }));
    const sortGroup = within(drawer.getByRole("group", { name: "Ordenar" }));

    expect(drawer.getByRole("link", { name: "Vintage" })).toHaveAttribute(
      "href",
      "/?category=buzos&size=L&exclusivos=1&novedades=1&sort=price_asc",
    );
    expect(drawer.getByRole("link", { name: "Exclusivos" })).toHaveAttribute(
      "href",
      "/?brand=vintage&category=buzos&size=L&novedades=1&sort=price_asc",
    );
    expect(drawer.getByRole("link", { name: "Novedades" })).toHaveAttribute(
      "href",
      "/?brand=vintage&category=buzos&size=L&exclusivos=1&sort=price_asc",
    );
    expect(
      sortGroup.getByRole("checkbox", { name: "Exclusivos" }),
    ).toBeChecked();
    expect(
      sortGroup.getByRole("checkbox", { name: "Novedades" }),
    ).toBeChecked();
    expect(sortGroup.getAllByDisplayValue("1")[1]).toHaveAttribute(
      "name",
      "novedades",
    );
    expect(brandGroup.getByLabelText("Vintage")).toHaveAttribute("name", "brand");
    expect(categoryGroup.getByLabelText("Buzos")).toHaveAttribute(
      "name",
      "category",
    );
    expect(sizeGroup.getByLabelText("L")).toHaveAttribute("name", "size");
    expect(sortGroup.getByLabelText("Menor precio")).toHaveAttribute(
      "value",
      "price_asc",
    );
    expect(sortGroup.getByLabelText("Menor precio")).toBeChecked();
    expect(
      drawer.getByRole("button", { name: "Aplicar filtros" }),
    ).toBeInTheDocument();
    expect(drawer.getByRole("link", { name: "Limpiar" })).toHaveAttribute(
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

    fireEvent.click(screen.getByRole("button", { name: "Filtrar" }));

    const drawer = within(
      screen.getByRole("dialog", { name: "Filtros del catalogo" }),
    );

    expect(
      drawer.getByRole("button", { name: "Limpiar" }),
    ).toBeDisabled();
  });
});

describe("parsePublicCatalogState", () => {
  it("normalizes supported query params", () => {
    expect(
      parsePublicCatalogState({
        brand: " import ",
        category: "buzos",
        exclusivos: "1",
        size: " l ",
        novedades: "1",
        page: "2",
        sort: "price_desc",
      }),
    ).toEqual({
      brand: "import",
      category: "buzos",
      exclusive: true,
      size: "L",
      recent: true,
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
