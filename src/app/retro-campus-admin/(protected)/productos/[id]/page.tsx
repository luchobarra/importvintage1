import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyProductList } from "@/components/products/EmptyProductList";
import { EditProductFormContainer } from "@/containers/products/EditProductFormContainer";
import { ProductImageManagerContainer } from "@/containers/products/ProductImageManagerContainer";
import { getPublicCatalogOptions } from "@/features/catalog-options/queries";
import type { CatalogOptions } from "@/features/catalog-options/types";
import { getAdminProductById } from "@/features/products/queries";
import type { Product } from "@/features/products/types";
import Link from "next/link";

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;
  let product: Product | null = null;
  let options: CatalogOptions | null = null;
  let errorMessage = "";

  try {
    [product, options] = await Promise.all([
      getAdminProductById(id),
      getPublicCatalogOptions(),
    ]);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "No se pudo cargar el producto.";
  }

  return (
    <AdminShell>
      <AdminHeader
        eyebrow="Principal / Productos"
        title="Editar producto"
        description="Modifica los datos básicos de la prenda. Las imágenes se editarán más adelante."
        actions={
          <Link className="button button--ghost" href="/retro-campus-admin/productos">
            Volver
          </Link>
        }
      />

      <section className="admin-form-panel">
        {product && options ? (
          <EditProductFormContainer options={options} product={product} />
        ) : (
          <EmptyProductList
            title="No se pudo cargar el producto"
            message={errorMessage}
          />
        )}
      </section>

      {product ? (
        <section className="admin-form-panel">
          <ProductImageManagerContainer
            images={product.product_images}
            productId={product.id}
          />
        </section>
      ) : null}
    </AdminShell>
  );
}
