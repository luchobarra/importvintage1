import {
  getProductConditionName,
  formatProductPrice,
  getProductBrandName,
  getProductSizeLabel,
} from "@/features/products/formatters";
import { ProductCardImage } from "@/components/catalog/ProductCardImage";
import { ProductDetailIntentLink } from "@/components/catalog/ProductDetailIntentLink";
import { createPublicProductDetailHref } from "@/features/products/public-filters";
import type { Product } from "@/features/products/types";
import { ViewTransition, type CSSProperties } from "react";

type ProductCardProps = {
  catalogHref: string;
  index?: number;
  product: Product;
};

export function ProductCard({ catalogHref, index = 0, product }: ProductCardProps) {
  const mainImage = product.product_images[0];
  const brandName = getProductBrandName(product);
  const productTitle = product.title;
  const sizeLabel = getProductSizeLabel(product);
  const conditionName = getProductConditionName(product);
  const enterDelay = `${Math.min(index, 5) * 14}ms`;
  const imageLoading = index < 4 ? "eager" : "lazy";
  const detailHref = createPublicProductDetailHref(product.id, catalogHref);

  return (
    <ProductDetailIntentLink
      ariaLabel={`Ver detalle de ${productTitle} de ${brandName}`}
      className="product-card"
      href={detailHref}
      style={{ "--product-card-enter-delay": enterDelay } as CSSProperties}
      transitionTypes={["nav-forward"]}
    >
      {product.is_exclusive ? (
        <span className="product-card__exclusive-badge">Exclusivo</span>
      ) : null}
      <ViewTransition name={`product-image-${product.id}`}>
        <div className="product-card__image">
          {mainImage ? (
            <ProductCardImage
              src={mainImage.image_url}
              alt={`${productTitle} de ${brandName}`}
              loading={imageLoading}
              sizes="(max-width: 640px) 50vw, (max-width: 1120px) 33vw, 290px"
            />
          ) : (
            <span>Sin foto</span>
          )}
        </div>
      </ViewTransition>
      <div className="product-card__body">
        <div className="product-card__kicker-row">
          <p className="product-card__brand">{brandName}</p>
          <span className="product-card__status">Disponible</span>
        </div>
        <h2 className="product-card__title">{productTitle}</h2>
        <p className="product-card__price">{formatProductPrice(product.price)}</p>
        <dl className="product-card__details">
          <div>
            <dt>Talle</dt>
            <dd>{sizeLabel}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{conditionName}</dd>
          </div>
        </dl>
      </div>
    </ProductDetailIntentLink>
  );
}
