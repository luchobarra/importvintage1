import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { getPublicCatalogOptions } from "@/features/catalog-options/queries";
import { Suspense, ViewTransition } from "react";

type PublicLayoutProps = {
  children: React.ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      <Suspense fallback={<PublicHeader categories={[]} />}>
        <PublicHeaderContainer />
      </Suspense>
      <ViewTransition
        enter={{
          "nav-back": "page-nav-back",
          "nav-forward": "page-nav-forward",
          default: "none",
        }}
        exit={{
          "nav-back": "page-nav-back",
          "nav-forward": "page-nav-forward",
          default: "none",
        }}
      >
        {children}
      </ViewTransition>
      <PublicFooter />
    </>
  );
}

async function PublicHeaderContainer() {
  const options = await getPublicCatalogOptions();

  return <PublicHeader categories={options.categories} />;
}
