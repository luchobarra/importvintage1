import { ProductDetailContainer } from "@/containers/catalog/ProductDetailContainer";
import {
  getCatalogReturnHref,
  type PublicProductSearchParams,
} from "@/features/products/public-filters";
import {
  formatProductPrice,
  getProductBrandName,
  getProductSizeLabel,
} from "@/features/products/formatters";
import { getAvailableProductById } from "@/features/products/queries";
import { createSiteUrl } from "@/lib/site-url";
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
    const brandName = getProductBrandName(product);
    const sizeLabel = getProductSizeLabel(product);
    const price = formatProductPrice(product.price);
    const imageUrl = product.product_images[0]?.image_url;
    const productUrl = createSiteUrl(`/productos/${product.id}`);
    const description = `${product.title} de ${brandName}, talle ${sizeLabel}, disponible en Retro Campus por ${price}. Ropa vintage seleccionada para compra directa.`;

    return {
      title: product.title,
      description,
      alternates: {
        canonical: productUrl,
      },
      openGraph: {
        title: `${product.title} | Retro Campus`,
        description,
        images: imageUrl
          ? [
              {
                url: imageUrl,
                alt: `${product.title} de ${brandName}`,
              },
            ]
          : undefined,
        siteName: "Retro Campus",
        type: "website",
        url: productUrl,
      },
      twitter: {
        card: imageUrl ? "summary_large_image" : "summary",
        description,
        images: imageUrl ? [imageUrl] : ["/brand/retro-campus-logo.png"],
        title: `${product.title} | Retro Campus`,
      },
    };
  } catch {
    return {
      title: "Producto no disponible",
      description: "Este producto ya no esta disponible en Retro Campus.",
    };
  }
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: ProductDetailPageProps) {
  const { id } = await params;
  const catalogHref = await searchParams.then(getCatalogReturnHref);

  return (
    <main className="product-detail-page">
      <section className="product-detail-page__container ui-page-container">
        <ProductDetailContainer catalogHref={catalogHref} productId={id} />
      </section>
    </main>
  );
}
