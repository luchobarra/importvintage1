import { ProductDetail } from "@/components/catalog/ProductDetail";
import { ProductDetailError } from "@/components/catalog/ProductDetailError";
import { ProductCarousel } from "@/components/catalog/ProductCarousel";
import { ProductCarouselSkeleton } from "@/components/catalog/ProductCarouselSkeleton";
import {
  getAvailableProductById,
  getSimilarAvailableProducts,
} from "@/features/products/queries";
import type { Product } from "@/features/products/types";
import { Suspense } from "react";

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

  return (
    <>
      <ProductDetail catalogHref={catalogHref} product={product} />
      <Suspense fallback={<ProductCarouselSkeleton />}>
        <SimilarProductsCarousel catalogHref={catalogHref ?? "/"} product={product} />
      </Suspense>
    </>
  );
}

type SimilarProductsCarouselProps = {
  catalogHref: string;
  product: Product;
};

async function SimilarProductsCarousel({
  catalogHref,
  product,
}: SimilarProductsCarouselProps) {
  const similarProducts = await getSimilarAvailableProducts(product, 12);

  return (
    <ProductCarousel
      catalogHref={catalogHref}
      eyebrow="Relacionados"
      products={similarProducts}
      title="Seguí explorando"
    />
  );
}
