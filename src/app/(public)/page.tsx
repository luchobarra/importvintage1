import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { ProductGridSkeleton } from "@/components/catalog/ProductGridSkeleton";
import { ProductGridContainer } from "@/containers/catalog/ProductGridContainer";
import { getPublicCatalogOptions } from "@/features/catalog-options/queries";
import {
  hasPublicCatalogControls,
  parsePublicCatalogState,
  type PublicProductSearchParams,
} from "@/features/products/public-filters";
import { createSiteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { Suspense } from "react";

type HomeProps = {
  searchParams: Promise<PublicProductSearchParams>;
};

export const metadata: Metadata = {
  title: "Prendas vintage seleccionadas",
  description:
    "Explora prendas vintage disponibles en Old Times Vintage y contacta directo por WhatsApp.",
  alternates: {
    canonical: createSiteUrl("/"),
  },
  openGraph: {
    title: "Old Times Vintage",
    description:
      "Prendas vintage seleccionadas, disponibles para compra directa.",
    url: createSiteUrl("/"),
  },
};

export default async function Home({ searchParams }: HomeProps) {
  const catalogState = {
    ...parsePublicCatalogState(await searchParams),
    page: 1,
  };
  const hasActiveControls = hasPublicCatalogControls(catalogState);
  const options = await getPublicCatalogOptions();
  const heading = catalogState.exclusive
    ? {
        description:
          "Una seleccion premium de piezas especiales, elegidas por calidad, rareza y presencia.",
        title: "Exclusivos",
      }
    : {
        description: "",
        title: "Prendas disponibles",
      };

  return (
    <main className="home">
      <section className="home__container ui-page-container">
        <header className="home__header">
          <div>
            <h1 className="home__title text-display">{heading.title}</h1>
            {heading.description ? (
              <p className="home__description text-body">
                {heading.description}
              </p>
            ) : null}
          </div>
        </header>

        <CatalogFilters
          hasActiveControls={hasActiveControls}
          options={options}
          state={catalogState}
        />
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGridContainer state={catalogState} />
        </Suspense>
      </section>
    </main>
  );
}
