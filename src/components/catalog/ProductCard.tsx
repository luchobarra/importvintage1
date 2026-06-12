import type { Product } from "@/features/products/types";
import Image from "next/image";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.product_images[0];

  return (
    <article className="product-card">
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
        <p className="product-card__brand">{product.brand}</p>
        <h2>{product.title}</h2>
        <p className="product-card__meta">Talle {product.size}</p>
        <p className="product-card__price">
          {currencyFormatter.format(product.price)}
        </p>
      </div>
    </article>
  );
}

