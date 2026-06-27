import {
  formatProductPrice,
  getProductBrandName,
  getProductSizeLabel,
} from "@/features/products/formatters";
import { ProductCardImage } from "@/components/catalog/ProductCardImage";
import { createPublicProductDetailHref } from "@/features/products/public-filters";
import type { Product } from "@/features/products/types";
import Link from "next/link";
import type { CSSProperties } from "react";

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
  const enterDelay = `${Math.min(index, 5) * 14}ms`;
  const imageLoading = index < 4 ? "eager" : "lazy";

  return (
    <Link
      className="product-card"
      href={createPublicProductDetailHref(product.id, catalogHref)}
      aria-label={`Ver detalle de ${productTitle} de ${brandName}`}
      style={{ "--product-card-enter-delay": enterDelay } as CSSProperties}
    >
      <div className="product-card__image">
        {mainImage ? (
          <ProductCardImage
            src={mainImage.image_url}
            alt={`${productTitle} de ${brandName}`}
            loading={imageLoading}
            sizes="(max-width: 640px) 50vw, (max-width: 960px) 33vw, 260px"
          />
        ) : (
          <span>Sin foto</span>
        )}
      </div>
      <div className="product-card__body">
        <p className="product-card__brand">{brandName}</p>
        <h2 className="product-card__title">{productTitle}</h2>
        <div className="product-card__ornament" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="product-card__price">{formatProductPrice(product.price)}</p>
      </div>
      <div className="product-card__footer">
        <span className="product-card__size">
          <span className="product-card__footer-label">Talle</span>
          <strong>{sizeLabel}</strong>
        </span>
        <span className="product-card__status">Disponible</span>
      </div>
    </Link>
  );
}
