import { CatalogPagination } from "@/components/catalog/CatalogPagination";
import { emptyPublicCatalogState } from "@/features/products/public-filters";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("CatalogPagination", () => {
  it("keeps active filters when moving between pages", () => {
    render(
      <CatalogPagination
        state={{
          ...emptyPublicCatalogState,
          brand: "vintage",
          category: "buzos",
          page: 2,
          sort: "price_desc",
        }}
        totalCount={36}
      />,
    );

    expect(screen.getByText("Pagina 2 de 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Anterior" })).toHaveAttribute(
      "href",
      "/?brand=vintage&category=buzos&sort=price_desc",
    );
    expect(screen.getByRole("link", { name: "Siguiente" })).toHaveAttribute(
      "href",
      "/?brand=vintage&category=buzos&sort=price_desc&page=3",
    );
  });

  it("does not render when there is only one page", () => {
    const { container } = render(
      <CatalogPagination state={emptyPublicCatalogState} totalCount={12} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
