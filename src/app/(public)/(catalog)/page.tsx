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
    "Retro Campus es una marca de ropa vintage seleccionada, enfocada en prendas únicas con identidad, calidad y presencia. Nuevos ingresos disponibles en catálogo online, Instagram y grupo de WhatsApp.",
  alternates: {
    canonical: createSiteUrl("/"),
  },
  keywords: [
    "Retro Campus",
    "ropa vintage Retro Campus",
    "marca de ropa vintage",
    "ropa vintage seleccionada",
    "prendas vintage seleccionadas",
    "prendas únicas",
    "buzos vintage",
    "camperas vintage",
    "pantalones vintage",
    "moda circular",
    "piezas exclusivas vintage",
  ],
  openGraph: {
    title: "Retro Campus - Ropa vintage seleccionada",
    description:
      "Marca de ropa vintage seleccionada: prendas únicas con identidad, calidad y presencia, disponibles en catálogo online, Instagram y grupo de WhatsApp.",
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
      "Marca de ropa vintage seleccionada: prendas únicas con identidad, calidad y presencia.",
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
          "Una selección premium de piezas especiales, elegidas por calidad, rareza y presencia.",
        title: "Exclusivos",
      }
    : {
        description:
          "Nuestra selección disponible de prendas vintage, para quienes buscan un estilo único que solo Retro Campus puede ofrecer.",
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
