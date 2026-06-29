import { ProductDetail } from "@/components/catalog/ProductDetail";
import { ProductDetailError } from "@/components/catalog/ProductDetailError";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import type { Product } from "@/features/products/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const testProduct: Product = {
  id: "product-123",
  title: "Campera vintage",
  brand_id: null,
  brand: "Import Vintage",
  category_id: null,
  category: "buzos",
  condition_id: "condition-1",
  condition: "Muy bueno",
  size_id: null,
  size: "L",
  price: 25000,
  description: "Campera en excelente estado.",
  is_exclusive: true,
  status: "available",
  product_images: [
    {
      id: "image-1",
      image_path: "products/image-1.png",
      image_url: "/window.svg",
      position: 0,
    },
    {
      id: "image-2",
      image_path: "products/image-2.png",
      image_url: "/globe.svg",
      position: 1,
    },
  ],
};

describe("public product detail flow", () => {
  it("links catalog cards to the product detail route", () => {
    render(
      <ProductGrid
        catalogHref="/?brand=import&page=2&sort=price_asc"
        products={[testProduct]}
      />,
    );

    expect(
      screen.getByRole("link", {
        name: "Ver detalle de Campera vintage de Import Vintage",
      }),
    ).toHaveAttribute(
      "href",
      "/productos/product-123?from=%2F%3Fbrand%3Dimport%26page%3D2%26sort%3Dprice_asc",
    );
  });

  it("renders the selected product information", () => {
    render(
      <ProductDetail
        catalogHref="/?brand=import&page=2"
        product={testProduct}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Campera vintage" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Import Vintage")).toBeInTheDocument();
    expect(screen.getByText(/\$\s*25\.000/)).toBeInTheDocument();
    expect(screen.getByText("Campera en excelente estado.")).toBeInTheDocument();
    expect(screen.getByText("Talle")).toBeInTheDocument();
    expect(screen.getByText("L")).toBeInTheDocument();
    expect(screen.getByText("Categoria")).toBeInTheDocument();
    expect(screen.getAllByText("buzos")).toHaveLength(2);
    expect(screen.getByText("Estado")).toBeInTheDocument();
    expect(screen.getByText("Muy bueno")).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Volver al catalogo" }),
    ).toHaveAttribute("href", "/?brand=import&page=2");
  });

  it("renders a controlled error state when the product cannot load", () => {
    render(<ProductDetailError />);

    expect(screen.getByRole("alert")).toHaveTextContent("Algo salio mal");
    expect(
      screen.getByRole("link", { name: "Volver al catalogo" }),
    ).toHaveAttribute("href", "/");
  });
});
