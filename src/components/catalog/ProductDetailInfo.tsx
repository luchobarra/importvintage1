import { formatProductPrice } from "@/features/products/formatters";
import type { Product } from "@/features/products/types";
import Link from "next/link";

type ProductDetailInfoProps = {
  catalogHref?: string;
  product: Product;
};

export function ProductDetailInfo({
  catalogHref = "/",
  product,
}: ProductDetailInfoProps) {
  return (
    <section className="product-detail__info" aria-labelledby="product-title">
      <p className="product-detail__brand">{product.brand}</p>
      <h1 id="product-title">{product.title}</h1>

      <p className="product-detail__price">
        {formatProductPrice(product.price)}
      </p>

      <dl className="product-detail__meta">
        <div>
          <dt>Talle</dt>
          <dd>{product.size}</dd>
        </div>
        <div>
          <dt>Categoria</dt>
          <dd>{product.category}</dd>
        </div>
      </dl>

      {product.description ? (
        <div className="product-detail__description">
          <h2>Descripcion</h2>
          <p>{product.description}</p>
        </div>
      ) : null}

      <div className="product-detail__actions">
        <Link className="button button--primary" href={catalogHref}>
          Ver mas productos
        </Link>
        <Link className="button" href={catalogHref}>
          Volver al catalogo
        </Link>
      </div>
    </section>
  );
}
