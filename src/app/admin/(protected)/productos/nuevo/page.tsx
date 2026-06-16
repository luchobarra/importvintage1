import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyProductList } from "@/components/products/EmptyProductList";
import { ProductFormContainer } from "@/containers/products/ProductFormContainer";
import { getPublicCatalogOptions } from "@/features/catalog-options/queries";
import type { CatalogOptions } from "@/features/catalog-options/types";
import Link from "next/link";

export default async function NewProductPage() {
  let options: CatalogOptions | null = null;
  let errorMessage = "";

  try {
    options = await getPublicCatalogOptions();
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudieron cargar las opciones del catalogo.";
  }

  return (
    <AdminShell>
      <AdminHeader
        eyebrow="Productos"
        title="Nuevo producto"
        description="Carga la informacion de la prenda y entre 1 y 5 fotos. La primera imagen se usa como foto principal."
        actions={
          <Link className="button" href="/admin">
            Volver
          </Link>
        }
      />

      <section className="admin-form-panel">
        {options ? (
          <ProductFormContainer options={options} />
        ) : (
          <EmptyProductList
            title="No se pudo cargar el formulario"
            message={errorMessage}
          />
        )}
      </section>
    </AdminShell>
  );
}
