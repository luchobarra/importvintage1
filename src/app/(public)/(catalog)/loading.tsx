import { CatalogFiltersFallback } from "@/components/catalog/CatalogFiltersFallback";
import { HomeEditorialBanner } from "@/components/catalog/HomeEditorialBanner";
import { ProductGridSkeleton } from "@/components/catalog/ProductGridSkeleton";

export default function Loading() {
  return (
    <main className="home">
      <HomeEditorialBanner />
      <section className="home__container ui-page-container">
        <header className="home__header">
          <div>
            <h1 className="home__title text-display">Prendas disponibles</h1>
          </div>
        </header>

        <CatalogFiltersFallback />
        <ProductGridSkeleton />
      </section>
    </main>
  );
}
