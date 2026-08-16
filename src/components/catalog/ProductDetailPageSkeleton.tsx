import { ProductCarouselSkeleton } from "@/components/catalog/ProductCarouselSkeleton";
import { ProductDetailSkeleton } from "@/components/catalog/ProductDetailSkeleton";

export function ProductDetailPageSkeleton() {
  return (
    <>
      <ProductDetailSkeleton />
      <ProductCarouselSkeleton />
    </>
  );
}
