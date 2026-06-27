import {
  getProductBrandName,
  getProductCategoryName,
} from "@/features/products/formatters";
import type { Product } from "@/features/products/types";

type ProductDetailHeadingProps = {
  product: Product;
};

export function ProductDetailHeading({ product }: ProductDetailHeadingProps) {
  return (
    <header className="product-detail__heading">
      <p className="product-detail__eyebrow">
        <span>{getProductBrandName(product)}</span>
        <span aria-hidden="true">/</span>
        <span>{getProductCategoryName(product)}</span>
      </p>
      <h1 id="product-title" className="product-detail__title">
        {product.title}
      </h1>
    </header>
  );
}
