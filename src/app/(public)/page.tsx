import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { HomeEditorialBanner } from "@/components/catalog/HomeEditorialBanner";
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
  title: "Retro Campus - Ropa vintage seleccionada",
  description:
    "Explora el catalogo online de Retro Campus: ropa vintage seleccionada, prendas unicas, buzos, camperas, pantalones y piezas exclusivas disponibles para compra directa.",
  alternates: {
    canonical: createSiteUrl("/"),
  },
  keywords: [
    "Retro Campus",
    "ropa vintage Retro Campus",
    "catalogo de ropa vintage",
    "prendas vintage seleccionadas",
    "buzos vintage",
    "camperas vintage",
    "pantalones vintage",
    "moda circular",
    "piezas exclusivas vintage",
  ],
  openGraph: {
    title: "Retro Campus - Catalogo online de ropa vintage",
    description:
      "Ropa vintage seleccionada por Retro Campus: prendas unicas, piezas exclusivas y compra directa.",
    images: [
      {
        url: "/brand/retro-campus-logo.png",
        alt: "Logo de Retro Campus",
        height: 816,
        width: 720,
      },
    ],
    url: createSiteUrl("/"),
  },
  twitter: {
    card: "summary",
    description:
      "Ropa vintage seleccionada por Retro Campus: prendas unicas y piezas exclusivas.",
    images: ["/brand/retro-campus-logo.png"],
    title: "Retro Campus - Ropa vintage seleccionada",
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
      <HomeEditorialBanner />
      <section className="home__container ui-page-container">
        <header className="home__header" id="productos">
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
