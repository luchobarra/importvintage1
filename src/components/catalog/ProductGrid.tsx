import { ProductCard } from "@/components/catalog/ProductCard";
import type { Product } from "@/features/products/types";

type ProductGridProps = {
  catalogHref: string;
  products: Product[];
};

export function ProductGrid({ catalogHref, products }: ProductGridProps) {
  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          catalogHref={catalogHref}
          key={product.id}
          product={product}
        />
      ))}
    </div>
  );
}
