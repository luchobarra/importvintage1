import { ProductDetailSkeleton } from "@/components/catalog/ProductDetailSkeleton";

export default function Loading() {
  return (
    <main className="product-detail-page product-detail-page--loading">
      <section className="product-detail-page__container ui-page-container">
        <ProductDetailSkeleton />
      </section>
    </main>
  );
}
