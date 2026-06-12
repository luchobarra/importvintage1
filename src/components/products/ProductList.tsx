import { ProductListItem } from "@/components/products/ProductListItem";
import type { Product } from "@/features/products/types";

type ProductListProps = {
  products: Product[];
};

export function ProductList({ products }: ProductListProps) {
  return (
    <div className="admin-product-list">
      {products.map((product) => (
        <ProductListItem key={product.id} product={product} />
      ))}
    </div>
  );
}

