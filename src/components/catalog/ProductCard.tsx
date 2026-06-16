import {
  formatProductPrice,
  getProductBrandName,
  getProductSizeLabel,
} from "@/features/products/formatters";
import { createPublicProductDetailHref } from "@/features/products/public-filters";
import type { Product } from "@/features/products/types";
import Image from "next/image";
import Link from "next/link";

type ProductCardProps = {
  catalogHref: string;
  product: Product;
};

export function ProductCard({ catalogHref, product }: ProductCardProps) {
  const mainImage = product.product_images[0];

  return (
    <Link
      className="product-card"
      href={createPublicProductDetailHref(product.id, catalogHref)}
    >
      <div className="product-card__image">
        {mainImage ? (
          <Image
            src={mainImage.image_url}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1100px) 33vw, 260px"
          />
        ) : (
          <span>Sin foto</span>
        )}
      </div>
      <div className="product-card__body">
        <p className="product-card__brand">{getProductBrandName(product)}</p>
        <h2>{product.title}</h2>
        <p className="product-card__meta">
          Talle {getProductSizeLabel(product)}
        </p>
        <p className="product-card__price">
          {formatProductPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}
