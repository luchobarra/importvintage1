import { ProductDetailPageSkeleton } from "@/components/catalog/ProductDetailPageSkeleton";

export default function Loading() {
  return (
    <main className="product-detail-page product-detail-page--loading">
      <section className="product-detail-page__container ui-page-container">
        <ProductDetailPageSkeleton />
      </section>
    </main>
  );
}
