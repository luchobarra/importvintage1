import { getPublicCatalogOptions } from "@/features/catalog-options/queries";
import {
  createPublicCatalogHref,
  emptyPublicCatalogState,
} from "@/features/products/public-filters";
import { getAvailableProductSitemapItems } from "@/features/products/queries";
import { createSiteUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();
  const [options, products] = await Promise.all([
    getPublicCatalogOptions(),
    getAvailableProductSitemapItems(),
  ]);

  return [
    {
      changeFrequency: "daily",
      lastModified: currentDate,
      priority: 1,
      url: createSiteUrl("/"),
    },
    {
      changeFrequency: "daily",
      lastModified: currentDate,
      priority: 0.8,
      url: createSiteUrl(getExclusiveProductsHref()),
    },
    ...options.categories.map((category) => ({
      changeFrequency: "daily" as const,
      lastModified: currentDate,
      priority: 0.8,
      url: createSiteUrl(getCategoryHref(category.slug)),
    })),
    ...products.map((product) => ({
      changeFrequency: "weekly" as const,
      lastModified: product.created_at ? new Date(product.created_at) : currentDate,
      priority: 0.7,
      url: createSiteUrl(`/productos/${product.id}`),
    })),
  ];
}

function getCategoryHref(categorySlug: string) {
  return createPublicCatalogHref({
    ...emptyPublicCatalogState,
    category: categorySlug,
  });
}

function getExclusiveProductsHref() {
  return createPublicCatalogHref({
    ...emptyPublicCatalogState,
    exclusive: true,
  });
}
