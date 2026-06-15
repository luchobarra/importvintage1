import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { ProductGridContainer } from "@/containers/catalog/ProductGridContainer";
import {
  hasPublicCatalogControls,
  parsePublicCatalogState,
  type PublicProductSearchParams,
} from "@/features/products/public-filters";

type HomeProps = {
  searchParams: Promise<PublicProductSearchParams>;
};

export default async function Home({ searchParams }: HomeProps) {
  const catalogState = parsePublicCatalogState(await searchParams);
  const hasActiveControls = hasPublicCatalogControls(catalogState);

  return (
    <main className="home">
      <section className="home__container">
        <header className="home__header">
          <div>
            <p className="home__eyebrow">Catalogo online</p>
            <h1 className="home__title">Prendas disponibles</h1>
          </div>
          <a className="home__admin-link" href="/admin/login">
            Admin
          </a>
        </header>

        <CatalogFilters
          hasActiveControls={hasActiveControls}
          state={catalogState}
        />
        <ProductGridContainer state={catalogState} />
      </section>
    </main>
  );
}
