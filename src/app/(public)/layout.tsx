import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicHeaderSkeleton } from "@/components/layout/PublicHeaderSkeleton";
import { getPublicCatalogOptions } from "@/features/catalog-options/queries";
import { Suspense } from "react";

type PublicLayoutProps = {
  children: React.ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      <Suspense fallback={<PublicHeaderSkeleton />}>
        <PublicHeaderContainer />
      </Suspense>
      {children}
    </>
  );
}

async function PublicHeaderContainer() {
  const options = await getPublicCatalogOptions();

  return <PublicHeader categories={options.categories} />;
}
