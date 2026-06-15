import { ProductDetailImages } from "@/components/catalog/ProductDetailImages";
import { ProductDetailInfo } from "@/components/catalog/ProductDetailInfo";
import type { Product } from "@/features/products/types";

type ProductDetailProps = {
  catalogHref?: string;
  product: Product;
};

export function ProductDetail({ catalogHref, product }: ProductDetailProps) {
  return (
    <article className="product-detail">
      <ProductDetailImages
        images={product.product_images}
        title={product.title}
      />
      <ProductDetailInfo catalogHref={catalogHref} product={product} />
    </article>
  );
}
