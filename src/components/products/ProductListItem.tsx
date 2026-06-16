import { ProductListItemActionsContainer } from "@/containers/products/ProductListItemActionsContainer";
import {
  getProductBrandName,
  getProductCategoryName,
  getProductSizeLabel,
} from "@/features/products/formatters";
import type { Product } from "@/features/products/types";
import Image from "next/image";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type ProductListItemProps = {
  product: Product;
};

export function ProductListItem({ product }: ProductListItemProps) {
  const mainImage = product.product_images[0];

  return (
    <article className="admin-product-item">
      <div className="admin-product-item__image">
        {mainImage ? (
          <Image
            src={mainImage.image_url}
            alt={product.title}
            fill
            sizes="72px"
          />
        ) : (
          <span>Sin foto</span>
        )}
      </div>

      <div className="admin-product-item__content">
        <div>
          <p className="admin-product-item__brand">
            {getProductBrandName(product)}
          </p>
          <h2>{product.title}</h2>
        </div>

        <dl className="admin-product-item__meta">
          <div>
            <dt>Categoria</dt>
            <dd>{getProductCategoryName(product)}</dd>
          </div>
          <div>
            <dt>Talle</dt>
            <dd>{getProductSizeLabel(product)}</dd>
          </div>
          <div>
            <dt>Precio</dt>
            <dd>{currencyFormatter.format(product.price)}</dd>
          </div>
          <div>
            <dt>ID</dt>
            <dd>{product.id}</dd>
          </div>
        </dl>
      </div>

      <ProductListItemActionsContainer productId={product.id} />
    </article>
  );
}
