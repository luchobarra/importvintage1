import { ProductDetailSkeleton } from "@/components/catalog/ProductDetailSkeleton";

export default function Loading() {
  return (
    <main className="product-detail-page">
      <section className="product-detail-page__container">
        <ProductDetailSkeleton />
      </section>
    </main>
  );
}
