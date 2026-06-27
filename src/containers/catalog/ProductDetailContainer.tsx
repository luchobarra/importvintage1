import { ProductDetail } from "@/components/catalog/ProductDetail";
import { ProductDetailError } from "@/components/catalog/ProductDetailError";
import { ProductCarousel } from "@/components/catalog/ProductCarousel";
import {
  getAvailableProductById,
  getSimilarAvailableProducts,
} from "@/features/products/queries";
import type { Product } from "@/features/products/types";

type ProductDetailContainerProps = {
  catalogHref?: string;
  productId: string;
};

export async function ProductDetailContainer({
  catalogHref,
  productId,
}: ProductDetailContainerProps) {
  let product: Product;

  try {
    product = await getAvailableProductById(productId);
  } catch {
    return <ProductDetailError />;
  }

  const similarProducts = await getSimilarAvailableProducts(product, 12);

  return (
    <>
      <ProductDetail catalogHref={catalogHref} product={product} />
      <ProductCarousel
        catalogHref={catalogHref ?? "/"}
        eyebrow="Relacionados"
        products={similarProducts}
        title="Seguí explorando"
      />
    </>
  );
}
