import { ProductDetailHeading } from "@/components/catalog/ProductDetailHeading";
import { ProductDetailInfo } from "@/components/catalog/ProductDetailInfo";
import type { Product } from "@/features/products/types";
import { ProductDetailGalleryContainer } from "@/containers/catalog/ProductDetailGalleryContainer";

type ProductDetailProps = {
  catalogHref?: string;
  product: Product;
};

export function ProductDetail({ catalogHref, product }: ProductDetailProps) {
  return (
    <article className="product-detail">
      <div className="product-detail__media-column">
        <ProductDetailGalleryContainer
          images={product.product_images}
          productId={product.id}
          title={product.title}
        />
      </div>
      <div className="product-detail__content-column">
        <ProductDetailHeading product={product} />
        <ProductDetailInfo catalogHref={catalogHref} product={product} />
      </div>
    </article>
  );
}
