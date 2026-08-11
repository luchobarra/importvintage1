import { ProductCardSkeleton } from "@/components/catalog/ProductCardSkeleton";

type ProductGridSkeletonProps = {
  count?: number;
};

export function ProductGridSkeleton({ count = 10 }: ProductGridSkeletonProps) {
  return (
    <div aria-label="Cargando productos" aria-live="polite" role="status">
      <div className="product-grid">
        {Array.from({ length: count }, (_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
