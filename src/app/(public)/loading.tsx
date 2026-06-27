import { CatalogFiltersSkeleton } from "@/components/catalog/CatalogFiltersSkeleton";
import { ProductGridSkeleton } from "@/components/catalog/ProductGridSkeleton";

export default function Loading() {
  return (
    <main className="home">
      <section className="home__container ui-page-container">
        <header className="home__header">
          <div>
            <div className="home__title home__title--skeleton product-detail__skeleton" />
          </div>
        </header>

        <CatalogFiltersSkeleton />
        <ProductGridSkeleton />
      </section>
    </main>
  );
}
