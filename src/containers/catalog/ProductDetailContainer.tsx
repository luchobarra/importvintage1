import { ProductDetail } from "@/components/catalog/ProductDetail";
import { ProductDetailError } from "@/components/catalog/ProductDetailError";
import { getAvailableProductById } from "@/features/products/queries";
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

  return <ProductDetail catalogHref={catalogHref} product={product} />;
}
