import {
  ProductSearch,
  type ProductSearchFilters,
} from "@/components/products/ProductSearch";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const emptyFilters: ProductSearchFilters = {
  id: "",
  title: "",
  brand: "",
  category: "",
  size: "",
};

describe("ProductSearch", () => {
  it("renders all filter fields and actions", () => {
    renderProductSearch();

    expect(screen.getByLabelText("ID")).toBeInTheDocument();
    expect(screen.getByLabelText("Titulo")).toBeInTheDocument();
    expect(screen.getByLabelText("Marca")).toBeInTheDocument();
    expect(screen.getByLabelText("Categoria")).toBeInTheDocument();
    expect(screen.getByLabelText("Talle")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buscar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Limpiar" })).toBeInTheDocument();
  });

  it("submits the search only when the user presses Buscar", () => {
    const onSearch = vi.fn();

    renderProductSearch({ onSearch });

    expect(onSearch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("notifies filter changes with the field name and value", () => {
    const onFilterChange = vi.fn();

    renderProductSearch({ onFilterChange });

    fireEvent.change(screen.getByLabelText("Titulo"), {
      target: { value: "campera" },
    });
    fireEvent.change(screen.getByLabelText("Talle"), {
      target: { value: "xl" },
    });

    expect(onFilterChange).toHaveBeenCalledWith("title", "campera");
    expect(onFilterChange).toHaveBeenCalledWith("size", "xl");
  });

  it("shows validation errors from the container", () => {
    renderProductSearch({
      errorMessage: "Ingresa al menos 3 caracteres.",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ingresa al menos 3 caracteres.",
    );
  });
});

function renderProductSearch(
  overrides: Partial<Parameters<typeof ProductSearch>[0]> = {},
) {
  return render(
    <ProductSearch
      errorMessage=""
      filters={emptyFilters}
      onClear={vi.fn()}
      onFilterChange={vi.fn()}
      onSearch={vi.fn()}
      resultCount={0}
      totalCount={0}
      {...overrides}
    />,
  );
}
