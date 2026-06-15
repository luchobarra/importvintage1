import { ProductDetailContainer } from "@/containers/catalog/ProductDetailContainer";
import {
  getCatalogReturnHref,
  type PublicProductSearchParams,
} from "@/features/products/public-filters";
import { getAvailableProductById } from "@/features/products/queries";
import type { Metadata } from "next";

type ProductDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<PublicProductSearchParams>;
};

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const product = await getAvailableProductById(id);

    return {
      title: `${product.title} | Catalogo Online`,
      description:
        product.description ??
        `${product.brand} talle ${product.size} disponible en el catalogo.`,
    };
  } catch {
    return {
      title: "Producto no disponible | Catalogo Online",
      description: "Detalle de producto del catalogo publico.",
    };
  }
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: ProductDetailPageProps) {
  const { id } = await params;
  const catalogHref = getCatalogReturnHref(await searchParams);

  return (
    <main className="product-detail-page">
      <section className="product-detail-page__container">
        <ProductDetailContainer catalogHref={catalogHref} productId={id} />
      </section>
    </main>
  );
}
