import {
  formatProductPrice,
  getProductCategoryName,
  getProductConditionName,
  getProductSizeLabel,
} from "@/features/products/formatters";
import { createProductContactHref } from "@/features/products/contact";
import type { Product } from "@/features/products/types";
import { CircleCheck, Ruler, ShieldCheck, Tag } from "lucide-react";
import Link from "next/link";

type ProductDetailInfoProps = {
  catalogHref?: string;
  product: Product;
};

export function ProductDetailInfo({
  catalogHref = "/",
  product,
}: ProductDetailInfoProps) {
  const categoryName = getProductCategoryName(product);
  const conditionName = getProductConditionName(product);
  const sizeLabel = getProductSizeLabel(product);

  return (
    <section className="product-detail__info" aria-labelledby="product-title">
      <p className="product-detail__price text-h2">
        {formatProductPrice(product.price)}
      </p>

      <dl className="product-detail__meta">
        <div className="product-detail__meta-item product-detail__meta-item--size">
          <span className="product-detail__meta-icon" aria-hidden="true">
            <Ruler size={15} strokeWidth={1.8} />
          </span>
          <div>
            <dt className="text-caption text-overline">Talle</dt>
            <dd className="text-body-lg">{sizeLabel}</dd>
          </div>
        </div>
        <div className="product-detail__meta-item product-detail__meta-item--category">
          <span className="product-detail__meta-icon" aria-hidden="true">
            <Tag size={15} strokeWidth={1.8} />
          </span>
          <div>
            <dt className="text-caption text-overline">Categoria</dt>
            <dd className="text-body-lg">{categoryName}</dd>
          </div>
        </div>
        <div className="product-detail__meta-item product-detail__meta-item--condition">
          <span className="product-detail__meta-icon" aria-hidden="true">
            <ShieldCheck size={15} strokeWidth={1.8} />
          </span>
          <div>
            <dt className="text-caption text-overline">Estado</dt>
            <dd className="text-body-lg">{conditionName}</dd>
          </div>
        </div>
        <div className="product-detail__meta-item product-detail__meta-item--availability">
          <span className="product-detail__meta-icon" aria-hidden="true">
            <CircleCheck size={15} strokeWidth={1.8} />
          </span>
          <div>
            <dt className="text-caption text-overline">Disponibilidad</dt>
            <dd className="text-body-lg">Disponible</dd>
          </div>
        </div>
      </dl>

      {product.description ? (
        <div className="product-detail__description">
          <h2 className="text-h3">Descripción</h2>
          <p className="text-body-lg">{product.description}</p>
        </div>
      ) : null}

      <div className="product-detail__actions">
        <a
          className="button button--primary product-detail__contact-button"
          href={createProductContactHref(product.id)}
          rel="noopener noreferrer"
          target="_blank"
        >
          Contactar con el vendedor
        </a>
        <Link
          className="button button--ghost product-detail__back-link"
          href={catalogHref}
          transitionTypes={["nav-back"]}
        >
          Volver al catalogo
        </Link>
      </div>
    </section>
  );
}
